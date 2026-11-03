"""Auth routes — user registration and role assignment."""

import logging
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.models.user import UserSchema

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

user_schema = UserSchema()


@auth_bp.route("/register", methods=["POST"])
@require_auth
def register():
    """Register a new user in Firestore.

    The Firebase Authentication account is created on the frontend; this
    endpoint creates the corresponding Firestore ``users`` document with a
    role.

    Request JSON:
        displayName (str): User display name.
        role (str): One of admin, hospital, donor.
        phone (str, optional): Phone number.
        organizationName (str, optional): Hospital / organisation name.

    Returns:
        201: Created user document.
        400: Validation error.
        409: User already registered.
    """
    uid = request.user["uid"]
    email = request.user["email"]

    body = request.get_json(silent=True) or {}
    body["email"] = email  # always use the token's email

    try:
        validated = user_schema.load(body)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    db = firestore.client()

    # Check if user doc already exists
    existing = db.collection("users").document(uid).get()
    if existing.exists:
        return jsonify({"error": "User is already registered", "status": 409}), 409

    now = datetime.now(timezone.utc)
    validated["createdAt"] = now
    validated["updatedAt"] = now

    db.collection("users").document(uid).set(validated)
    validated["uid"] = uid
    # Serialise timestamps
    validated["createdAt"] = now.isoformat()
    validated["updatedAt"] = now.isoformat()

    logger.info("User registered: %s (%s)", uid, validated.get("role"))
    return jsonify({"message": "User registered successfully", "user": validated}), 201
