"""User routes — profile management endpoints."""

import logging
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.models.user import UserUpdateSchema

logger = logging.getLogger(__name__)

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

user_update_schema = UserUpdateSchema()


@users_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """Get the current authenticated user's profile.

    Returns:
        200: User profile.
        404: User profile not found in Firestore.
    """
    uid = request.user["uid"]
    db = firestore.client()
    doc = db.collection("users").document(uid).get()

    if not doc.exists:
        if uid.startswith("demo-"):
            role = request.user.get("role", "donor")
            return jsonify({
                "uid": uid,
                "email": request.user.get("email"),
                "displayName": f"Demo {role.capitalize()}",
                "role": role,
                "phone": "+1-555-0199",
                "organizationName": "City General Hospital" if role == "hospital" else "",
            }), 200
        return jsonify({"error": "User profile not found", "status": 404}), 404

    data = doc.to_dict()
    data["uid"] = uid
    # Serialise timestamps
    for key in ("createdAt", "updatedAt"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()

    return jsonify(data), 200


@users_bp.route("/me", methods=["PUT"])
@require_auth
def update_current_user():
    """Update the current authenticated user's profile.

    Request JSON:
        displayName (str, optional), phone (str, optional),
        organizationName (str, optional).

    Returns:
        200: Updated user profile.
        400: Validation error.
        404: User profile not found.
    """
    uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    try:
        validated = user_update_schema.load(body)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    db = firestore.client()
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()

    if not doc.exists:
        if uid.startswith("demo-"):
            role = request.user.get("role", "donor")
            return jsonify({
                "uid": uid,
                "email": request.user.get("email"),
                "displayName": f"Demo {role.capitalize()}",
                "role": role,
                "phone": "+1-555-0199",
                "organizationName": "City General Hospital" if role == "hospital" else "",
            }), 200
        return jsonify({"error": "User profile not found", "status": 404}), 404

    now = datetime.now(timezone.utc)
    validated["updatedAt"] = now

    update_data = {k: v for k, v in validated.items() if v is not None}
    doc_ref.update(update_data)

    existing = doc.to_dict()
    existing.update(update_data)
    existing["uid"] = uid
    # Serialise timestamps
    for key in ("createdAt", "updatedAt"):
        val = existing.get(key)
        if val and hasattr(val, "isoformat"):
            existing[key] = val.isoformat()

    return jsonify(existing), 200


@users_bp.route("", methods=["GET"])
@require_auth
@require_role("admin")
def list_users():
    """List all users (Admin only).

    Query Parameters:
        role (str, optional): Filter by role.
        limit (int, optional): Max results.

    Returns:
        200: List of user profiles.
    """
    db = firestore.client()
    role_filter = request.args.get("role")
    limit = request.args.get("limit", 100, type=int)

    query = db.collection("users")
    if role_filter:
        from google.cloud.firestore_v1.base_query import FieldFilter
        query = query.where(filter=FieldFilter("role", "==", role_filter))

    docs = query.limit(limit).stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        data["uid"] = doc.id
        for key in ("createdAt", "updatedAt"):
            val = data.get(key)
            if val and hasattr(val, "isoformat"):
                data[key] = val.isoformat()
        results.append(data)

    return jsonify(results), 200
