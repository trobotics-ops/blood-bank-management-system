"""Notification service — CRUD operations on the Firestore notifications collection."""

import logging
from datetime import datetime, timezone
from typing import Optional

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)

COLLECTION = "notifications"


def _db():
    """Return a Firestore client."""
    return firestore.client()


def create_notification(
    recipient_uid: str,
    notification_type: str,
    title: str,
    message: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
) -> dict:
    """Create a new notification document in Firestore.

    Args:
        recipient_uid: UID of the recipient user.
        notification_type: One of expiry_alert, request_update, camp_reminder, low_stock, general.
        title: Notification title.
        message: Notification body.
        related_entity_type: Optional entity type (request, camp, inventory).
        related_entity_id: Optional entity ID.

    Returns:
        Dict with the created notification data including its ``id``.
    """
    db = _db()
    now = datetime.now(timezone.utc)

    data = {
        "recipientUid": recipient_uid,
        "type": notification_type,
        "title": title,
        "message": message,
        "isRead": False,
        "relatedEntityType": related_entity_type,
        "relatedEntityId": related_entity_id,
        "createdAt": now,
    }

    doc_ref = db.collection(COLLECTION).add(data)
    doc_id = doc_ref[1].id
    data["id"] = doc_id
    # Convert datetime for JSON serialisation
    data["createdAt"] = now.isoformat()
    logger.info("Notification created: %s for user %s", doc_id, recipient_uid)
    return data


def get_notifications_for_user(uid: str, limit: int = 50) -> list[dict]:
    """Retrieve notifications for a user, ordered by creation date descending.

    Args:
        uid: The recipient user ID.
        limit: Maximum number of notifications to return.

    Returns:
        List of notification dicts.
    """
    db = _db()
    docs = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("recipientUid", "==", uid))
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )

    results = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        # Serialise timestamps
        if d.get("createdAt"):
            d["createdAt"] = d["createdAt"].isoformat() if hasattr(d["createdAt"], "isoformat") else d["createdAt"]
        results.append(d)
    return results


def mark_as_read(notification_id: str, uid: str) -> Optional[dict]:
    """Mark a notification as read.

    Args:
        notification_id: Document ID of the notification.
        uid: UID of the requesting user (must be the recipient).

    Returns:
        Updated notification dict, or ``None`` if not found or not authorised.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(notification_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data.get("recipientUid") != uid:
        return None

    doc_ref.update({"isRead": True})
    data["isRead"] = True
    data["id"] = doc.id
    if data.get("createdAt") and hasattr(data["createdAt"], "isoformat"):
        data["createdAt"] = data["createdAt"].isoformat()
    return data


def get_unread_count(uid: str) -> int:
    """Return the number of unread notifications for a user.

    Args:
        uid: The recipient user ID.

    Returns:
        Integer count of unread notifications.
    """
    db = _db()
    docs = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("recipientUid", "==", uid))
        .where(filter=FieldFilter("isRead", "==", False))
        .stream()
    )
    count = sum(1 for _ in docs)
    return count
