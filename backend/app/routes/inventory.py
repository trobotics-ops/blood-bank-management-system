"""Inventory routes — CRUD endpoints for blood units."""

import logging

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.services import inventory_service

logger = logging.getLogger(__name__)

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@inventory_bp.route("/summary", methods=["GET"])
@require_auth
def get_summary():
    """Get blood stock summary grouped by blood type.

    All authenticated roles can access this endpoint.

    Returns:
        200: List of {bloodType, totalUnits}.
    """
    summary = inventory_service.get_inventory_summary()
    return jsonify(summary), 200


@inventory_bp.route("/expiring", methods=["GET"])
@require_auth
@require_role("admin")
def get_expiring():
    """Get blood units expiring within N days (Admin only).

    Query Parameters:
        days (int, optional): Number of days window (default 7).

    Returns:
        200: List of expiring blood units.
    """
    days = request.args.get("days", 7, type=int)
    units = inventory_service.get_expiring_units(days=days)
    return jsonify(units), 200


@inventory_bp.route("", methods=["GET"])
@require_auth
def list_inventory():
    """List all blood units with optional filters.

    Admins see full details; hospitals see summary only (redirected to /summary).

    Query Parameters:
        bloodType (str, optional): Filter by blood type.
        status (str, optional): Filter by status.
        component (str, optional): Filter by component type.
        limit (int, optional): Max results.

    Returns:
        200: List of blood units.
    """
    role = request.user["role"]

    # Hospitals can only see the summary endpoint for detailed data
    if role == "hospital":
        summary = inventory_service.get_inventory_summary()
        return jsonify(summary), 200

    blood_type = request.args.get("bloodType")
    status = request.args.get("status")
    component = request.args.get("component")
    limit = request.args.get("limit", 200, type=int)

    units = inventory_service.list_blood_units(
        blood_type=blood_type,
        status=status,
        component=component,
        limit=limit,
    )
    return jsonify(units), 200


@inventory_bp.route("", methods=["POST"])
@require_auth
@require_role("admin")
def add_blood_unit():
    """Add a new blood unit to inventory (Admin only).

    Request JSON:
        bloodType, units, collectionDate, component (required).
        donorId, status, notes (optional).

    Returns:
        201: Created blood unit.
        400: Validation error.
    """
    admin_uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    try:
        unit = inventory_service.create_blood_unit(body, admin_uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    return jsonify(unit), 201


@inventory_bp.route("/<unit_id>", methods=["GET"])
@require_auth
def get_blood_unit(unit_id: str):
    """Get a blood unit by ID.

    Returns:
        200: Blood unit details.
        404: Not found.
    """
    unit = inventory_service.get_blood_unit(unit_id)
    if not unit:
        return jsonify({"error": "Blood unit not found", "status": 404}), 404
    return jsonify(unit), 200


@inventory_bp.route("/<unit_id>", methods=["PUT"])
@require_auth
@require_role("admin")
def update_blood_unit(unit_id: str):
    """Update a blood unit (Admin only).

    Returns:
        200: Updated blood unit.
        400: Validation error.
        404: Not found.
    """
    body = request.get_json(silent=True) or {}

    try:
        unit = inventory_service.update_blood_unit(unit_id, body)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    if not unit:
        return jsonify({"error": "Blood unit not found", "status": 404}), 404

    return jsonify(unit), 200


@inventory_bp.route("/<unit_id>", methods=["DELETE"])
@require_auth
@require_role("admin")
def delete_blood_unit(unit_id: str):
    """Delete a blood unit from inventory (Admin only).

    Returns:
        200: Success message.
        404: Not found.
    """
    deleted = inventory_service.delete_blood_unit(unit_id)
    if not deleted:
        return jsonify({"error": "Blood unit not found", "status": 404}), 404
    return jsonify({"message": "Blood unit deleted successfully"}), 200
