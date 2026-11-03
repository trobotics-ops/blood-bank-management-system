"""Camp routes — CRUD, donor registration, and completion endpoints."""

import logging

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.services import camp_service, donor_service

logger = logging.getLogger(__name__)

camps_bp = Blueprint("camps", __name__, url_prefix="/api/camps")


@camps_bp.route("/my", methods=["GET"])
@require_auth
def get_my_camps():
    """Get camps the current donor is registered for.

    Returns:
        200: List of camps the donor has registered for.
        404: No donor profile found.
    """
    uid = request.user["uid"]
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify([]), 200

    donor_id = donor["id"]
    all_camps = camp_service.list_camps(limit=500)
    my_camps = [c for c in all_camps if donor_id in (c.get("registeredDonors") or [])]
    return jsonify(my_camps), 200


@camps_bp.route("/reminders", methods=["POST"])
def trigger_camp_reminders():
    """Trigger email/system reminders for camps happening tomorrow.

    Returns:
        200: Count of reminders dispatched.
    """
    sent = camp_service.send_camp_reminders()
    return jsonify({"message": f"Dispatched {sent} camp reminder(s)", "remindersSent": sent}), 200


@camps_bp.route("", methods=["GET"])
@require_auth
def list_camps():
    """List blood donation camps.

    All authenticated roles can access this endpoint.

    Query Parameters:
        status (str, optional): Filter by camp status.
        limit (int, optional): Max results.

    Returns:
        200: List of camps.
    """
    status = request.args.get("status")
    limit = request.args.get("limit", 100, type=int)

    camps = camp_service.list_camps(status=status, limit=limit)
    return jsonify(camps), 200


@camps_bp.route("", methods=["POST"])
@require_auth
@require_role("admin")
def create_camp():
    """Create a new blood donation camp (Admin only).

    Request JSON:
        name, venue, address, city, date, startTime, endTime,
        organizer, capacity (required).
        description (optional).

    Returns:
        201: Created camp.
        400: Validation error.
    """
    admin_uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    try:
        camp = camp_service.create_camp(body, admin_uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    return jsonify(camp), 201


@camps_bp.route("/<camp_id>/registrations", methods=["GET"])
@require_auth
@require_role("admin")
def get_camp_registrations(camp_id: str):
    """Get list of registered donors for a camp (Admin only).

    Returns:
        200: List of donor profiles registered for the camp.
        404: Camp not found.
    """
    camp = camp_service.get_camp_by_id(camp_id)
    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404

    registered_ids = camp.get("registeredDonors") or []
    donors = []
    for did in registered_ids:
        d = donor_service.get_donor_by_id(did)
        if d:
            donors.append(d)

    return jsonify(donors), 200


@camps_bp.route("/<camp_id>", methods=["GET"])
@require_auth
def get_camp(camp_id: str):
    """Get a camp by ID.

    Returns:
        200: Camp details.
        404: Not found.
    """
    camp = camp_service.get_camp_by_id(camp_id)
    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404
    return jsonify(camp), 200


@camps_bp.route("/<camp_id>", methods=["PUT"])
@require_auth
@require_role("admin")
def update_camp(camp_id: str):
    """Update a camp (Admin only).

    Returns:
        200: Updated camp.
        400: Validation error.
        404: Not found.
    """
    body = request.get_json(silent=True) or {}

    try:
        camp = camp_service.update_camp(camp_id, body)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404

    return jsonify(camp), 200


@camps_bp.route("/<camp_id>/register", methods=["POST"])
@require_auth
@require_role("donor")
def register_for_camp(camp_id: str):
    """Register the current donor for a camp (Donor only).

    The donor profile is looked up by the authenticated user's UID.

    Returns:
        200: Updated camp with the donor added.
        400: Camp full, not upcoming, or donor already registered.
        404: Camp or donor profile not found.
    """
    uid = request.user["uid"]

    # Find donor profile by uid
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found. Please register as a donor first.", "status": 404}), 404

    donor_id = donor["id"]

    try:
        camp = camp_service.register_donor_for_camp(camp_id, donor_id)
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404

    return jsonify(camp), 200


@camps_bp.route("/<camp_id>/unregister", methods=["POST"])
@camps_bp.route("/<camp_id>/register", methods=["DELETE"])
@require_auth
@require_role("donor")
def unregister_from_camp(camp_id: str):
    """Unregister the current donor from a camp (Donor only).

    Returns:
        200: Updated camp with the donor removed.
        400: Donor not registered or camp completed/cancelled.
        404: Camp or donor profile not found.
    """
    uid = request.user["uid"]

    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found", "status": 404}), 404

    donor_id = donor["id"]

    try:
        camp = camp_service.unregister_donor_from_camp(camp_id, donor_id)
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404

    return jsonify(camp), 200


@camps_bp.route("/<camp_id>/complete", methods=["PATCH"])
@require_auth
@require_role("admin")
def complete_camp(camp_id: str):
    """Mark a camp as completed with units collected (Admin only).

    Request JSON:
        unitsCollected (int, required): Number of units collected.

    Returns:
        200: Completed camp.
        400: Invalid data or camp already completed/cancelled.
        404: Not found.
    """
    body = request.get_json(silent=True) or {}
    units_collected = body.get("unitsCollected")

    if units_collected is None:
        return jsonify({"error": "unitsCollected is required", "status": 400}), 400

    try:
        units_collected = int(units_collected)
        if units_collected < 0:
            raise ValueError("Must be non-negative")
    except (ValueError, TypeError):
        return jsonify({"error": "unitsCollected must be a non-negative integer", "status": 400}), 400

    try:
        camp = camp_service.complete_camp(camp_id, units_collected)
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not camp:
        return jsonify({"error": "Camp not found", "status": 404}), 404

    return jsonify(camp), 200
