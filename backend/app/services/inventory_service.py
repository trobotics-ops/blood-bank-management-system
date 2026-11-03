"""Inventory service — business logic and Firestore CRUD for blood units."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from marshmallow import ValidationError

from app.models.inventory import InventorySchema, InventoryUpdateSchema

logger = logging.getLogger(__name__)

COLLECTION = "bloodInventory"

inventory_schema = InventorySchema()
inventory_update_schema = InventoryUpdateSchema()

# Shelf life in days per component type
COMPONENT_SHELF_LIFE: dict[str, int] = {
    "whole_blood": 35,
    "rbc": 42,
    "plasma": 365,
    "platelets": 5,
}


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


def calculate_expiry_date(collection_date: str, component: str) -> str:
    """Calculate the expiry date based on collection date and component type.

    Args:
        collection_date: ISO date string (YYYY-MM-DD).
        component: Blood component type.

    Returns:
        Expiry date as ISO date string (YYYY-MM-DD).
    """
    shelf_days = COMPONENT_SHELF_LIFE.get(component, 35)
    collected = datetime.strptime(collection_date, "%Y-%m-%d").date()
    expiry = collected + timedelta(days=shelf_days)
    return expiry.strftime("%Y-%m-%d")


def check_low_stock_alerts() -> None:
    """Check if any blood type has fewer than 5 available units and create admin notifications."""
    from app.services import notification_service

    try:
        db = _db()
        summary = get_inventory_summary()
        low_types = [s for s in summary if s.get("totalUnits", 0) < 5]

        if not low_types:
            return

        type_list = ", ".join(f"{s['bloodType']} ({s['totalUnits']} units)" for s in low_types)
        admin_docs = (
            db.collection("users")
            .where(filter=FieldFilter("role", "==", "admin"))
            .stream()
        )
        for admin_doc in admin_docs:
            notification_service.create_notification(
                recipient_uid=admin_doc.id,
                notification_type="low_stock",
                title="Low Blood Stock Warning",
                message=f"Critical low stock levels detected: {type_list}",
                related_entity_type="inventory",
            )
        logger.info("Low stock alerts sent for: %s", type_list)
    except Exception as exc:
        logger.error("Failed to check low stock alerts: %s", exc)


def create_blood_unit(data: dict, admin_uid: str) -> dict:
    """Add a new blood unit to inventory.

    Args:
        data: Raw request payload.
        admin_uid: UID of the admin adding the unit.

    Returns:
        Created blood unit dict with ``id``.

    Raises:
        ValidationError: If the payload is invalid.
    """
    validated = inventory_schema.load(data)
    db = _db()
    now = datetime.now(timezone.utc)

    # Auto-calculate expiry date
    validated["expiryDate"] = calculate_expiry_date(
        validated["collectionDate"], validated["component"]
    )
    validated["addedBy"] = admin_uid
    validated["status"] = validated.get("status", "available")
    validated["createdAt"] = now
    validated["updatedAt"] = now

    doc_ref = db.collection(COLLECTION).add(validated)
    doc_id = doc_ref[1].id
    validated["id"] = doc_id
    logger.info("Blood unit created: %s (%s)", doc_id, validated["bloodType"])

    # Auto-trigger check for low stock
    check_low_stock_alerts()

    return _serialise_timestamps(validated)


def get_blood_unit(unit_id: str) -> Optional[dict]:
    """Fetch a blood unit by document ID.

    Returns:
        Blood unit dict with ``id``, or ``None`` if not found.
    """
    db = _db()
    doc = db.collection(COLLECTION).document(unit_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return _serialise_timestamps(data)


def list_blood_units(
    blood_type: Optional[str] = None,
    status: Optional[str] = None,
    component: Optional[str] = None,
    limit: int = 200,
) -> list[dict]:
    """List blood units with optional filters.

    Args:
        blood_type: Filter by blood type.
        status: Filter by status.
        component: Filter by component type.
        limit: Maximum results.

    Returns:
        List of blood unit dicts.
    """
    db = _db()
    query = db.collection(COLLECTION)

    if blood_type:
        query = query.where(filter=FieldFilter("bloodType", "==", blood_type))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    if component:
        query = query.where(filter=FieldFilter("component", "==", component))

    docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results


def update_blood_unit(unit_id: str, data: dict) -> Optional[dict]:
    """Update a blood unit.

    Args:
        unit_id: Firestore document ID.
        data: Fields to update.

    Returns:
        Updated blood unit dict, or ``None`` if not found.

    Raises:
        ValidationError: If the payload is invalid.
    """
    validated = inventory_update_schema.load(data)
    db = _db()
    doc_ref = db.collection(COLLECTION).document(unit_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    existing = doc.to_dict()

    # Recalculate expiry if collection date or component changed
    collection_date = validated.get("collectionDate", existing.get("collectionDate"))
    component = validated.get("component", existing.get("component"))
    if "collectionDate" in validated or "component" in validated:
        validated["expiryDate"] = calculate_expiry_date(collection_date, component)

    validated["updatedAt"] = datetime.now(timezone.utc)
    update_data = {k: v for k, v in validated.items() if v is not None}

    doc_ref.update(update_data)
    existing.update(update_data)
    existing["id"] = unit_id

    # Auto-trigger check for low stock
    check_low_stock_alerts()

    return _serialise_timestamps(existing)


def delete_blood_unit(unit_id: str) -> bool:
    """Delete a blood unit from inventory.

    Args:
        unit_id: Firestore document ID.

    Returns:
        ``True`` if deleted, ``False`` if not found.
    """
    db = _db()
    doc_ref = db.collection(COLLECTION).document(unit_id)
    doc = doc_ref.get()
    if not doc.exists:
        return False
    doc_ref.delete()
    logger.info("Blood unit deleted: %s", unit_id)

    # Auto-trigger check for low stock
    check_low_stock_alerts()

    return True


def get_inventory_summary() -> list[dict]:
    """Get a summary of available blood units grouped by blood type.

    Returns:
        List of dicts with ``bloodType`` and ``totalUnits`` keys.
    """
    db = _db()
    docs = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("status", "==", "available"))
        .stream()
    )

    summary: dict[str, int] = {}
    for doc in docs:
        data = doc.to_dict()
        bt = data.get("bloodType", "Unknown")
        units = data.get("units", 0)
        summary[bt] = summary.get(bt, 0) + units

    # Return all blood types (including zeros)
    all_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    return [{"bloodType": bt, "totalUnits": summary.get(bt, 0)} for bt in all_types]


def get_expiring_units(days: int = 7) -> list[dict]:
    """Get blood units expiring within the specified number of days.

    Args:
        days: Number of days from today to check for expiry.

    Returns:
        List of blood unit dicts that are expiring within the window.
    """
    db = _db()
    today = datetime.now(timezone.utc).date()
    cutoff = (today + timedelta(days=days)).strftime("%Y-%m-%d")
    today_str = today.strftime("%Y-%m-%d")

    docs = (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("status", "==", "available"))
        .where(filter=FieldFilter("expiryDate", "<=", cutoff))
        .where(filter=FieldFilter("expiryDate", ">=", today_str))
        .stream()
    )

    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(_serialise_timestamps(data))
    return results
