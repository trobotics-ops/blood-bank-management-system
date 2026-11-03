"""Request routes — submit, approve, reject, and fulfill blood requests."""

import logging

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.auth import require_auth, require_role
from app.services import request_service

logger = logging.getLogger(__name__)

requests_bp = Blueprint("requests", __name__, url_prefix="/api/requests")


@requests_bp.route("", methods=["GET"])
@require_auth
def list_requests():
    """List blood requests.

    Admins see all requests; hospitals see only their own.

    Query Parameters:
        status (str, optional): Filter by status.
        limit (int, optional): Max results.

    Returns:
        200: List of blood requests.
    """
    uid = request.user["uid"]
    role = request.user["role"]
    status = request.args.get("status")
    limit = request.args.get("limit", 100, type=int)

    requests_list = request_service.list_requests(
        uid=uid,
        role=role,
        status=status,
        limit=limit,
    )
    return jsonify(requests_list), 200


@requests_bp.route("", methods=["POST"])
@require_auth
@require_role("hospital")
def create_request():
    """Submit a new blood request (Hospital only).

    Request JSON:
        hospitalName, contactPerson, contactPhone, bloodType,
        unitsNeeded, patientName, patientAge (required).
        urgencyLevel, reason (optional).

    Returns:
        201: Created blood request.
        400: Validation error.
    """
    uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    try:
        blood_request = request_service.create_request(body, uid)
    except ValidationError as err:
        return jsonify({"error": err.messages, "status": 400}), 400

    return jsonify(blood_request), 201


@requests_bp.route("/<request_id>", methods=["GET"])
@require_auth
def get_request(request_id: str):
    """Get a blood request by ID.

    Hospitals can only view their own requests.

    Returns:
        200: Request details.
        403: Not authorised.
        404: Not found.
    """
    uid = request.user["uid"]
    role = request.user["role"]

    blood_request = request_service.get_request_by_id(request_id)
    if not blood_request:
        return jsonify({"error": "Request not found", "status": 404}), 404

    # Hospitals can only view their own requests
    if role != "admin" and blood_request.get("requestedBy") != uid:
        return jsonify({"error": "Not authorised to view this request", "status": 403}), 403

    return jsonify(blood_request), 200


@requests_bp.route("/<request_id>/approve", methods=["PATCH"])
@require_auth
@require_role("admin")
def approve_request(request_id: str):
    """Approve a pending blood request (Admin only).

    Returns:
        200: Approved request.
        400: Request is not in pending status.
        404: Not found.
    """
    admin_uid = request.user["uid"]

    try:
        blood_request = request_service.approve_request(request_id, admin_uid)
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not blood_request:
        return jsonify({"error": "Request not found", "status": 404}), 404

    return jsonify(blood_request), 200


@requests_bp.route("/<request_id>/reject", methods=["PATCH"])
@require_auth
@require_role("admin")
def reject_request(request_id: str):
    """Reject a pending blood request with a reason (Admin only).

    Request JSON:
        rejectionReason (str, required): Reason for rejection.

    Returns:
        200: Rejected request.
        400: Missing reason or request not in pending status.
        404: Not found.
    """
    admin_uid = request.user["uid"]
    body = request.get_json(silent=True) or {}

    rejection_reason = body.get("rejectionReason", "").strip()
    if not rejection_reason:
        return jsonify({"error": "rejectionReason is required", "status": 400}), 400

    try:
        blood_request = request_service.reject_request(
            request_id, admin_uid, rejection_reason
        )
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not blood_request:
        return jsonify({"error": "Request not found", "status": 404}), 404

    return jsonify(blood_request), 200


@requests_bp.route("/<request_id>/fulfill", methods=["PATCH"])
@require_auth
@require_role("admin")
def fulfill_request(request_id: str):
    """Mark an approved blood request as fulfilled (Admin only).

    Returns:
        200: Fulfilled request.
        400: Request is not in approved status.
        404: Not found.
    """
    admin_uid = request.user["uid"]

    try:
        blood_request = request_service.fulfill_request(request_id, admin_uid)
    except ValueError as err:
        return jsonify({"error": str(err), "status": 400}), 400

    if not blood_request:
        return jsonify({"error": "Request not found", "status": 404}), 404

    return jsonify(blood_request), 200
