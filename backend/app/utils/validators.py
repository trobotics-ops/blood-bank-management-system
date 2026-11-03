"""Input validation helper utilities."""

import re
from datetime import datetime, date
from typing import Optional, Tuple, List

from app.utils.blood_compatibility import VALID_BLOOD_TYPES

VALID_COMPONENTS = ["whole_blood", "rbc", "plasma", "platelets"]
VALID_GENDERS = ["male", "female", "other"]
VALID_URGENCY_LEVELS = ["normal", "urgent", "critical"]
VALID_REQUEST_STATUSES = ["pending", "approved", "fulfilled", "rejected"]
VALID_CAMP_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"]
VALID_INVENTORY_STATUSES = ["available", "reserved", "expired", "used"]
VALID_ROLES = ["admin", "hospital", "donor"]
VALID_NOTIFICATION_TYPES = [
    "expiry_alert",
    "request_update",
    "camp_reminder",
    "low_stock",
    "general",
]


def validate_email(email: str) -> bool:
    """Return True if the email matches a basic email pattern."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Return True if the phone number contains only digits, spaces, dashes, or parens and is 7-15 chars."""
    cleaned = re.sub(r"[\s\-\(\)\+]", "", phone)
    return cleaned.isdigit() and 7 <= len(cleaned) <= 15


def validate_blood_type(blood_type: str) -> bool:
    """Return True if blood_type is one of the 8 standard types."""
    return blood_type in VALID_BLOOD_TYPES


def validate_date_string(date_str: str) -> bool:
    """Return True if date_str is in YYYY-MM-DD format and represents a real date."""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def validate_time_string(time_str: str) -> bool:
    """Return True if time_str is in HH:MM format."""
    try:
        datetime.strptime(time_str, "%H:%M")
        return True
    except (ValueError, TypeError):
        return False


def validate_required_fields(
    data: dict, required_fields: List[str]
) -> Tuple[bool, Optional[str]]:
    """Check that all required fields are present and non-empty in data.

    Returns:
        Tuple of (is_valid, error_message). error_message is None when valid.
    """
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None


def validate_positive_integer(value) -> bool:
    """Return True if value is a positive integer."""
    try:
        v = int(value)
        return v > 0
    except (ValueError, TypeError):
        return False
