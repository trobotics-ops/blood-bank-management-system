"""Donor service — business logic and Firestore CRUD for donors."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from marshmallow import ValidationError

from app.models.donor import DonorSchema, DonorUpdateSchema

logger = logging.getLogger(__name__)

COLLECTION = "donors"
ELIGIBILITY_DAYS = 56  # minimum days between donations

donor_schema = DonorSchema()
donor_update_schema = DonorUpdateSchema()


def _db():
    """Return a Firestore client."""
    return firestore.client()


def _serialise_timestamps(data: dict) -> dict:
    """Convert Firestore timestamp fields to ISO strings for JSON."""
    for key in ("createdAt", "updatedAt"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


def calculate_eligibility(last_donation_date: Optional[str]) -> bool:
    """Determine donor eligibility based on last donation date.

    A donor is eligible if they have never donated or if their last donation
    was at least 56 days ago.

    Args:
        last_donation_date: ISO date string (YYYY-MM-DD) or ``None``.

    Returns:
        ``True`` if eligible, ``False`` otherwise.
    """
    if not last_donation_date:
        return True
    try:
        last = datetime.strptime(last_donation_date, "%Y-%m-%d").date()
        today = datetime.now(timezone.utc).date()
        return (today - last).days >= ELIGIBILITY_DAYS
    except (ValueError, TypeError):
        return True


def create_donor(data: dict, uid: str) -> dict:
    """Register a new donor.

    Args:
        data: Raw request payload.
        uid: Firebase UID of the authenticated user.

    Returns:
        Created donor dict with ``id``.

    Raises:
        ValidationError: If the payload is invalid.
        ValueError: If the user is already registered as a donor.
    """
    validated = donor_schema.load(data)
    db = _db()

    # Check if donor already exists for this uid
    existing = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("uid", "==", uid))
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        raise ValueError("A donor profile already exists for this user")

    now = datetime.now(timezone.utc)
    validated["uid"] = uid
    validated["isEligible"] = calculate_eligibility(validated.get("lastDonationDate"))
    validated["totalDonations"] = 0
    validated["createdAt"] = now
    validated["updatedAt"] = now

    doc_ref = db.collection(COLLECTION).add(validated)
    doc_id = doc_ref[1].id
    validated["id"] = doc_id
    return _serialise_timestamps(validated)


def get_donor_by_id(donor_id: str) -> Optional[dict]:
    """Fetch a single donor by document ID.

    Returns:
        Donor dict with ``id``, or ``None`` if not found.
    """
    db = _db()
    doc = db.collection(COLLECTION).document(donor_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return _serialise_timestamps(data)


def get_donor_by_uid(uid: str) -> Optional[dict]:
    """Fetch a donor document by Firebase UID.

    Returns:
        Donor dict with ``id``, or ``None`` if not found.
    """
    db = _db()
    docs = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("uid", "==", uid))
        .limit(1)
        .stream()
    )
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        return _serialise_timestamps(data)
    return None


def list_donors(limit: int = 100) -> list[dict]:
    """Return all donors.

    Args:
        limit: Maximum number of donors to return.

    Returns:
        List of donor dicts.
    """
    db = _db()
    docs = db.collection(COLLECTION).order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results


def update_donor(donor_id: str, data: dict, uid: str) -> Optional[dict]:
    """Update a donor's profile.

    Args:
        donor_id: Firestore document ID.
        data: Fields to update.
        uid: UID of the requesting user (must own the donor doc or be admin).

    Returns:
        Updated donor dict, or ``None`` if not found.

    Raises:
        ValidationError: If the payload is invalid.
        PermissionError: If the user doesn't own this donor profile.
    """
    validated = donor_update_schema.load(data)
    db = _db()
    doc_ref = db.collection(COLLECTION).document(donor_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    existing = doc.to_dict()

    # Re-calculate eligibility if lastDonationDate changed
    if "lastDonationDate" in validated:
        validated["isEligible"] = calculate_eligibility(validated["lastDonationDate"])

    validated["updatedAt"] = datetime.now(timezone.utc)

    # Remove None-valued keys to avoid overwriting with None unintentionally
    update_data = {k: v for k, v in validated.items() if v is not None or k in ("lastDonationDate",)}

    doc_ref.update(update_data)
    existing.update(update_data)
    existing["id"] = donor_id
    return _serialise_timestamps(existing)


def search_donors(
    blood_type: Optional[str] = None,
    city: Optional[str] = None,
    is_eligible: Optional[bool] = None,
    limit: int = 100,
) -> list[dict]:
    """Search donors by blood type, city, and/or eligibility.

    Args:
        blood_type: Filter by blood type.
        city: Filter by city (case-sensitive).
        is_eligible: Filter by eligibility.
        limit: Maximum results.

    Returns:
        List of matching donor dicts.
    """
    db = _db()
    query = db.collection(COLLECTION)

    if blood_type:
        query = query.where(filter=FieldFilter("bloodType", "==", blood_type))
    if city:
        query = query.where(filter=FieldFilter("city", "==", city))
    if is_eligible is not None:
        query = query.where(filter=FieldFilter("isEligible", "==", is_eligible))

    docs = query.limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results
