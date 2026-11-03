"""Camp service — business logic and Firestore CRUD for blood donation camps."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from marshmallow import ValidationError

from app.models.camp import CampSchema, CampUpdateSchema
from app.services import notification_service

logger = logging.getLogger(__name__)

COLLECTION = "camps"

camp_schema = CampSchema()
camp_update_schema = CampUpdateSchema()


def _db():
    """Return a Firestore client."""
    return firestore.client()


def _serialise_timestamps(data: dict) -> dict:
    """Convert Firestore timestamp fields to ISO strings."""
    for key in ("createdAt", "updatedAt"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


def create_camp(data: dict, admin_uid: str) -> dict:
    """Create a new blood donation camp.

    Args:
        data: Raw request payload.
        admin_uid: UID of the admin creating the camp.

    Returns:
        Created camp dict with ``id``.

    Raises:
        ValidationError: If the payload is invalid.
    """
    validated = camp_schema.load(data)
    db = _db()
    now = datetime.now(timezone.utc)

    validated["createdBy"] = admin_uid
    validated["registeredDonors"] = []
    validated["unitsCollected"] = 0
    validated["status"] = "upcoming"
    validated["createdAt"] = now
    validated["updatedAt"] = now

    doc_ref = db.collection(COLLECTION).add(validated)
    doc_id = doc_ref[1].id
    validated["id"] = doc_id
    logger.info("Camp created: %s", doc_id)
    return _serialise_timestamps(validated)


def get_camp_by_id(camp_id: str) -> Optional[dict]:
    """Fetch a camp by document ID.

    Returns:
        Camp dict with ``id``, or ``None`` if not found.
    """
    db = _db()
    doc = db.collection(COLLECTION).document(camp_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return _serialise_timestamps(data)


def list_camps(
    status: Optional[str] = None,
    limit: int = 100,
) -> list[dict]:
    """List camps, optionally filtered by status.

    Args:
        status: Filter by camp status.
        limit: Maximum results.

    Returns:
        List of camp dicts.
    """
    db = _db()
    query = db.collection(COLLECTION)

    if status:
        query = query.where(filter=FieldFilter("status", "==", status))

    docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results


def update_camp(camp_id: str, data: dict) -> Optional[dict]:
    """Update a camp's details.

    Args:
        camp_id: Firestore document ID.
        data: Fields to update.

    Returns:
        Updated camp dict, or ``None`` if not found.

    Raises:
        ValidationError: If the payload is invalid.
    """
    validated = camp_update_schema.load(data)
    db = _db()
    doc_ref = db.collection(COLLECTION).document(camp_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    existing = doc.to_dict()
    validated["updatedAt"] = datetime.now(timezone.utc)
    update_data = {k: v for k, v in validated.items() if v is not None}

    doc_ref.update(update_data)
    existing.update(update_data)
    existing["id"] = camp_id
    return _serialise_timestamps(existing)


def register_donor_for_camp(camp_id: str, donor_id: str) -> Optional[dict]:
    """Register a donor for a camp.

    Args:
        camp_id: Firestore document ID.
        donor_id: The donor's Firestore document ID.

    Returns:
        Updated camp dict, or ``None`` if camp not found.

    Raises:
        ValueError: If the camp is full, not upcoming, or the donor is already registered.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(camp_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()

    if data.get("status") not in ("upcoming", "ongoing"):
        raise ValueError("Cannot register for a camp that is not upcoming or ongoing")

    registered = data.get("registeredDonors", [])

    if donor_id in registered:
        raise ValueError("Donor is already registered for this camp")

    capacity = data.get("capacity", 0)
    if len(registered) >= capacity:
        raise ValueError("Camp has reached maximum capacity")

    registered.append(donor_id)
    now = datetime.now(timezone.utc)
    doc_ref.update({
        "registeredDonors": registered,
        "updatedAt": now,
    })

    data["registeredDonors"] = registered
    data["updatedAt"] = now
    data["id"] = camp_id
    logger.info("Donor %s registered for camp %s", donor_id, camp_id)
    return _serialise_timestamps(data)


def unregister_donor_from_camp(camp_id: str, donor_id: str) -> Optional[dict]:
    """Unregister a donor from a camp.

    Args:
        camp_id: Firestore document ID.
        donor_id: The donor's Firestore document ID.

    Returns:
        Updated camp dict, or ``None`` if camp not found.

    Raises:
        ValueError: If the donor is not registered or camp is completed/cancelled.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(camp_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()

    if data.get("status") in ("completed", "cancelled"):
        raise ValueError("Cannot unregister from a completed or cancelled camp")

    registered = data.get("registeredDonors", [])
    if donor_id not in registered:
        raise ValueError("Donor is not registered for this camp")

    registered.remove(donor_id)
    now = datetime.now(timezone.utc)
    doc_ref.update({
        "registeredDonors": registered,
        "updatedAt": now,
    })

    data["registeredDonors"] = registered
    data["updatedAt"] = now
    data["id"] = camp_id
    logger.info("Donor %s unregistered from camp %s", donor_id, camp_id)
    return _serialise_timestamps(data)


def complete_camp(camp_id: str, units_collected: int) -> Optional[dict]:
    """Mark a camp as completed and record units collected.

    Args:
        camp_id: Firestore document ID.
        units_collected: Number of blood units collected.

    Returns:
        Updated camp dict, or ``None`` if not found.

    Raises:
        ValueError: If the camp is already completed or cancelled.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(camp_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data.get("status") in ("completed", "cancelled"):
        raise ValueError(f"Camp is already '{data.get('status')}'")

    now = datetime.now(timezone.utc)
    update = {
        "status": "completed",
        "unitsCollected": units_collected,
        "updatedAt": now,
    }
    doc_ref.update(update)
    data.update(update)
    data["id"] = camp_id
    logger.info("Camp %s completed with %d units collected", camp_id, units_collected)
    return _serialise_timestamps(data)


def send_camp_reminders() -> int:
    """Send reminder notifications for upcoming camps happening tomorrow.

    Returns:
        Total number of reminders sent.
    """
    db = _db()
    tomorrow_str = (datetime.now(timezone.utc).date() + timedelta(days=1)).strftime("%Y-%m-%d")

    camps = list_camps(status="upcoming", limit=500)
    reminders_sent = 0

    for camp in camps:
        if camp.get("date") == tomorrow_str:
            for donor_id in camp.get("registeredDonors", []):
                donor_doc = db.collection("donors").document(donor_id).get()
                if donor_doc.exists:
                    donor_data = donor_doc.to_dict()
                    donor_uid = donor_data.get("uid")
                    if donor_uid:
                        notification_service.create_notification(
                            recipient_uid=donor_uid,
                            notification_type="camp_reminder",
                            title="Reminder: Donation Camp Tomorrow!",
                            message=(
                                f"Friendly reminder that {camp['name']} takes place tomorrow at "
                                f"{camp['venue']}, {camp['city']} ({camp.get('startTime', '09:00')} - {camp.get('endTime', '17:00')})."
                            ),
                            related_entity_type="camp",
                            related_entity_id=camp.get("id"),
                        )
                        reminders_sent += 1

    logger.info("Sent %d camp reminders for %s", reminders_sent, tomorrow_str)
    return reminders_sent
