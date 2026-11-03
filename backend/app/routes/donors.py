"""Donor routes — CRUD and search endpoints for donors."""

import logging

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.services import donor_service

logger = logging.getLogger(__name__)

donors_bp = Blueprint("donors", __name__, url_prefix="/api/donors")


@donors_bp.route("/me", methods=["GET"])
@donors_bp.route("/profile", methods=["GET"])
@require_auth
def get_my_donor_profile():
    """Get the current authenticated user's donor profile.

    Returns:
        200: Donor profile.
        404: No donor profile found.
    """
    uid = request.user["uid"]
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found for this user", "status": 404}), 404
    return jsonify(donor), 200


@donors_bp.route("/me", methods=["PUT"])
@donors_bp.route("/profile", methods=["PUT"])
@require_auth
def update_my_donor_profile():
    """Update the current authenticated user's donor profile.

    Returns:
        200: Updated donor profile.
        400: Validation error.
        404: Donor profile not found.
    """
    uid = request.user["uid"]
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found for this user", "status": 404}), 404

    body = request.get_json(silent=True) or {}
    try:
        updated = donor_service.update_donor(donor["id"], body, uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    return jsonify(updated), 200


@donors_bp.route("/history", methods=["GET"])
@require_auth
def get_donation_history():
    """Get the current authenticated donor's donation history.

    Returns:
        200: Donation history and total stats.
        404: Donor not found.
    """
    uid = request.user["uid"]
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found", "status": 404}), 404

    return jsonify({
        "totalDonations": donor.get("totalDonations", 0),
        "lastDonationDate": donor.get("lastDonationDate"),
        "history": [],
    }), 200


@donors_bp.route("/stats", methods=["GET"])
@require_auth
def get_donor_stats():
    """Get statistics for the current donor.

    Returns:
        200: Donor statistics.
        404: Donor not found.
    """
    uid = request.user["uid"]
    donor = donor_service.get_donor_by_uid(uid)
    if not donor:
        return jsonify({"error": "No donor profile found", "status": 404}), 404

    return jsonify({
        "totalDonations": donor.get("totalDonations", 0),
        "isEligible": donor.get("isEligible", False),
        "bloodType": donor.get("bloodType"),
        "lastDonationDate": donor.get("lastDonationDate"),
    }), 200


@donors_bp.route("/search", methods=["GET"])
@require_auth
@require_role("admin", "hospital")
def search_donors():
    """Search donors by blood type, city, and/or eligibility.

    Query Parameters:
        bloodType (str, optional): Blood type filter.
        city (str, optional): City filter.
        isEligible (str, optional): 'true' or 'false'.
        limit (int, optional): Max results (default 100).

    Returns:
        200: List of matching donors.
    """
    blood_type = request.args.get("bloodType")
    city = request.args.get("city")
    is_eligible_str = request.args.get("isEligible")
    limit = request.args.get("limit", 100, type=int)

    is_eligible = None
    if is_eligible_str is not None:
        is_eligible = is_eligible_str.lower() == "true"

    donors = donor_service.search_donors(
        blood_type=blood_type,
        city=city,
        is_eligible=is_eligible,
        limit=limit,
    )
    return jsonify(donors), 200


@donors_bp.route("", methods=["GET"])
@require_auth
@require_role("admin")
def list_donors():
    """List all donors (Admin only).

    Query Parameters:
        limit (int, optional): Max results (default 100).

    Returns:
        200: List of donors.
    """
    limit = request.args.get("limit", 100, type=int)
    donors = donor_service.list_donors(limit=limit)
    return jsonify(donors), 200


@donors_bp.route("", methods=["POST"])
@require_auth
@require_role("donor")
def create_donor():
    """Register a new donor profile.

    Request JSON:
        name, email, phone, bloodType, dateOfBirth, gender (required).
        address, city, state, medicalHistory (optional).

    Returns:
        201: Created donor.
        400: Validation error.
        409: Donor profile already exists.
    """
    uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    # Pre-fill email from token
    body.setdefault("email", request.user["email"])

    try:
        donor = donor_service.create_donor(body, uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400
    except ValueError as err:
        return jsonify({"error": str(err), "status": 409}), 409

    return jsonify(donor), 201


@donors_bp.route("/<donor_id>", methods=["GET"])
@require_auth
def get_donor(donor_id: str):
    """Get a donor by ID.

    Returns:
        200: Donor details.
        404: Donor not found.
    """
    donor = donor_service.get_donor_by_id(donor_id)
    if not donor:
        return jsonify({"error": "Donor not found", "status": 404}), 404
    return jsonify(donor), 200


@donors_bp.route("/<donor_id>", methods=["PUT"])
@require_auth
def update_donor(donor_id: str):
    """Update a donor's profile.

    The donor owner or an admin may update the profile.

    Returns:
        200: Updated donor.
        400: Validation error.
        403: Not authorised.
        404: Donor not found.
    """
    uid = request.user["uid"]
    role = request.user["role"]
    body = request.get_json(silent=True) or {}

    # Verify ownership or admin
    existing = donor_service.get_donor_by_id(donor_id)
    if not existing:
        return jsonify({"error": "Donor not found", "status": 404}), 404

    if existing.get("uid") != uid and role != "admin":
        return jsonify({"error": "Not authorised to update this donor", "status": 403}), 403

    try:
        donor = donor_service.update_donor(donor_id, body, uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    if not donor:
        return jsonify({"error": "Donor not found", "status": 404}), 404

    return jsonify(donor), 200
