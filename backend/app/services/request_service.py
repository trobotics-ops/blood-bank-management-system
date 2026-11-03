"""Request service — business logic and Firestore CRUD for blood requests."""

import logging
from datetime import datetime, timezone
from typing import Optional

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from marshmallow import ValidationError

from app.models.request import RequestSchema
from app.services import notification_service
from app.utils.blood_compatibility import get_compatible_donors

logger = logging.getLogger(__name__)

COLLECTION = "bloodRequests"

request_schema = RequestSchema()


def _db():
    """Return a Firestore client."""
    return firestore.client()


def _serialise_timestamps(data: dict) -> dict:
    """Convert Firestore timestamp fields to ISO strings."""
    for key in ("createdAt", "updatedAt", "fulfilledAt"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


def create_request(data: dict, uid: str) -> dict:
    """Submit a new blood request.

    Args:
        data: Raw request payload.
        uid: Firebase UID of the requesting hospital user.

    Returns:
        Created blood request dict with ``id``.

    Raises:
        ValidationError: If the payload is invalid.
    """
    validated = request_schema.load(data)
    db = _db()
    now = datetime.now(timezone.utc)

    validated["requestedBy"] = uid
    validated["status"] = "pending"
    validated["rejectionReason"] = None
    validated["approvedBy"] = None
    validated["fulfilledAt"] = None
    validated["createdAt"] = now
    validated["updatedAt"] = now

    doc_ref = db.collection(COLLECTION).add(validated)
    doc_id = doc_ref[1].id
    validated["id"] = doc_id
    logger.info("Blood request created: %s by %s", doc_id, uid)

    # Notify all admins about new request
    _notify_admins_new_request(db, doc_id, validated)

    return _serialise_timestamps(validated)


def _notify_admins_new_request(db, request_id: str, request_data: dict) -> None:
    """Send notifications to all admin users about a new blood request."""
    try:
        admin_docs = (
            db.collection("users")
            .where(filter=FieldFilter("role", "==", "admin"))
            .stream()
        )
        for admin_doc in admin_docs:
            notification_service.create_notification(
                recipient_uid=admin_doc.id,
                notification_type="request_update",
                title="New Blood Request",
                message=(
                    f"New {request_data.get('urgencyLevel', 'normal')} request for "
                    f"{request_data.get('bloodType')} ({request_data.get('unitsNeeded', 1)} unit(s)) from "
                    f"{request_data.get('hospitalName')}."
                ),
                related_entity_type="request",
                related_entity_id=request_id,
            )
    except Exception as exc:
        logger.error("Failed to notify admins of new request: %s", exc)


def get_request_by_id(request_id: str) -> Optional[dict]:
    """Fetch a blood request by document ID.

    Returns:
        Request dict with ``id``, or ``None`` if not found.
    """
    db = _db()
    doc = db.collection(COLLECTION).document(request_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return _serialise_timestamps(data)


def list_requests(
    uid: Optional[str] = None,
    role: str = "admin",
    status: Optional[str] = None,
    limit: int = 100,
) -> list[dict]:
    """List blood requests. Admins see all; hospitals see only their own.

    Args:
        uid: UID of the requesting user.
        role: Role of the requesting user.
        status: Optional status filter.
        limit: Maximum results.

    Returns:
        List of request dicts.
    """
    db = _db()
    query = db.collection(COLLECTION)

    if role != "admin" and uid:
        query = query.where(filter=FieldFilter("requestedBy", "==", uid))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))

    docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results


def _auto_match_inventory(request_data: dict) -> list[dict]:
    """Check inventory for compatible blood types matching this request."""
    blood_type = request_data.get("bloodType")
    if not blood_type:
        return []

    compatible_types = get_compatible_donors(blood_type)
    db = _db()

    matches = []
    try:
        for ctype in compatible_types:
            docs = (
                db.collection("bloodInventory")
                .where(filter=FieldFilter("bloodType", "==", ctype))
                .where(filter=FieldFilter("status", "==", "available"))
                .limit(5)
                .stream()
            )
            for doc in docs:
                item = doc.to_dict()
                item["id"] = doc.id
                matches.append(item)
        logger.info(
            "Found %d compatible units for request %s (%s)",
            len(matches),
            request_data.get("id"),
            blood_type,
        )
    except Exception as exc:
        logger.error("Auto match inventory error: %s", exc)

    return matches


def approve_request(request_id: str, admin_uid: str) -> Optional[dict]:
    """Approve a pending blood request with compatible inventory matching.

    Args:
        request_id: Firestore document ID.
        admin_uid: UID of the approving admin.

    Returns:
        Updated request dict, or ``None`` if not found.

    Raises:
        ValueError: If the request is not in 'pending' status.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(request_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data.get("status") != "pending":
        raise ValueError(f"Request is already '{data.get('status')}', cannot approve")

    # Match compatible inventory units
    data["id"] = request_id
    matches = _auto_match_inventory(data)

    now = datetime.now(timezone.utc)
    update = {
        "status": "approved",
        "approvedBy": admin_uid,
        "updatedAt": now,
    }
    doc_ref.update(update)
    data.update(update)

    # Notify the requester
    match_msg = f" Compatible stock identified: {len(matches)} unit(s) available." if matches else ""
    notification_service.create_notification(
        recipient_uid=data.get("requestedBy", ""),
        notification_type="request_update",
        title="Blood Request Approved",
        message=f"Your request for {data.get('bloodType')} ({data.get('unitsNeeded', 1)} unit(s)) has been approved.{match_msg}",
        related_entity_type="request",
        related_entity_id=request_id,
    )

    logger.info("Request %s approved by %s", request_id, admin_uid)
    return _serialise_timestamps(data)


def reject_request(
    request_id: str, admin_uid: str, rejection_reason: str
) -> Optional[dict]:
    """Reject a pending blood request with a reason.

    Args:
        request_id: Firestore document ID.
        admin_uid: UID of the rejecting admin.
        rejection_reason: Explanation for the rejection.

    Returns:
        Updated request dict, or ``None`` if not found.

    Raises:
        ValueError: If the request is not in 'pending' status.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(request_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data.get("status") != "pending":
        raise ValueError(f"Request is already '{data.get('status')}', cannot reject")

    now = datetime.now(timezone.utc)
    update = {
        "status": "rejected",
        "rejectionReason": rejection_reason,
        "approvedBy": admin_uid,
        "updatedAt": now,
    }
    doc_ref.update(update)
    data.update(update)
    data["id"] = request_id

    # Notify the requester
    notification_service.create_notification(
        recipient_uid=data.get("requestedBy", ""),
        notification_type="request_update",
        title="Blood Request Rejected",
        message=f"Your request for {data.get('bloodType')} was rejected. Reason: {rejection_reason}",
        related_entity_type="request",
        related_entity_id=request_id,
    )

    logger.info("Request %s rejected by %s", request_id, admin_uid)
    return _serialise_timestamps(data)


def fulfill_request(request_id: str, admin_uid: str) -> Optional[dict]:
    """Mark an approved blood request as fulfilled.

    Args:
        request_id: Firestore document ID.
        admin_uid: UID of the admin fulfilling the request.

    Returns:
        Updated request dict, or ``None`` if not found.

    Raises:
        ValueError: If the request is not in 'approved' status.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(request_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data.get("status") != "approved":
        raise ValueError(f"Request is '{data.get('status')}', must be 'approved' to fulfill")

    now = datetime.now(timezone.utc)
    update = {
        "status": "fulfilled",
        "fulfilledAt": now,
        "updatedAt": now,
    }
    doc_ref.update(update)
    data.update(update)
    data["id"] = request_id

    # Notify the requester
    notification_service.create_notification(
        recipient_uid=data.get("requestedBy", ""),
        notification_type="request_update",
        title="Blood Request Fulfilled",
        message=f"Your blood request for {data.get('bloodType')} ({data.get('unitsNeeded', 1)} unit(s)) has been fulfilled.",
        related_entity_type="request",
        related_entity_id=request_id,
    )

    logger.info("Request %s fulfilled by %s", request_id, admin_uid)
    return _serialise_timestamps(data)
