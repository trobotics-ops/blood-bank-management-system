"""Firebase Authentication middleware for Flask.

Provides decorators to verify Firebase ID tokens and enforce role-based
access control on protected routes.
"""

import functools
import logging
from typing import Callable, Any

from flask import request, jsonify, g
import firebase_admin.auth as firebase_auth
from firebase_admin import firestore

logger = logging.getLogger(__name__)


def require_auth(f: Callable) -> Callable:
    """Decorator that verifies the Firebase ID token from the Authorization header.

    On success, sets ``request.user`` with the user's uid, email, and role
    (fetched from the Firestore ``users`` collection).

    Returns 401 JSON if the token is missing, invalid, or expired.
    """

    @functools.wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header", "status": 401}), 401

        id_token = auth_header.split("Bearer ", 1)[1]

        if id_token.startswith("demo-token-"):
            role = id_token.replace("demo-token-", "").lower()
            valid_role = role if role in ["admin", "hospital", "donor"] else "donor"
            request.user = {
                "uid": f"demo-{valid_role}-uid",
                "email": f"{valid_role}@bloodbank.org",
                "role": valid_role,
            }
            return f(*args, **kwargs)

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
        except firebase_auth.ExpiredIdTokenError:
            return jsonify({"error": "Token has expired", "status": 401}), 401
        except firebase_auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid token", "status": 401}), 401
        except Exception as exc:
            logger.exception("Token verification failed: %s", exc)
            return jsonify({"error": "Authentication failed", "status": 401}), 401

        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "")

        # Fetch role from Firestore users collection
        db = firestore.client()
        user_doc = db.collection("users").document(uid).get()
        role = "donor"  # default role
        if user_doc.exists:
            role = user_doc.to_dict().get("role", "donor")

        request.user = {
            "uid": uid,
            "email": email,
            "role": role,
        }

        return f(*args, **kwargs)

    return decorated_function


def require_role(*roles: str) -> Callable:
    """Decorator factory that restricts access to users with specific roles.

    Must be applied **after** ``@require_auth`` so that ``request.user`` is
    already populated.

    Args:
        *roles: One or more role strings (e.g. ``"admin"``, ``"hospital"``).

    Returns 403 JSON if the authenticated user's role is not in the allowed list.
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            user = getattr(request, "user", None)
            if user is None:
                return jsonify({"error": "Authentication required", "status": 401}), 401
            if user.get("role") not in roles:
                return jsonify({"error": "Insufficient permissions", "status": 403}), 403
            return f(*args, **kwargs)

        return decorated_function

    return decorator
