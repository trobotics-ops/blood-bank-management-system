"""Blood type compatibility utilities.

Implements the standard blood-type compatibility chart for transfusion safety.
"""

from typing import List

# Mapping: recipient blood type -> list of compatible donor blood types
_COMPATIBILITY: dict[str, list[str]] = {
    "O-":  ["O-"],
    "O+":  ["O-", "O+"],
    "A-":  ["O-", "A-"],
    "A+":  ["O-", "O+", "A-", "A+"],
    "B-":  ["O-", "B-"],
    "B+":  ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
}

VALID_BLOOD_TYPES: list[str] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


def can_receive_from(recipient_type: str, donor_type: str) -> bool:
    """Check if a recipient blood type can safely receive from a donor type.

    Args:
        recipient_type: The blood type of the recipient (e.g. ``"A+"``).
        donor_type: The blood type of the donor (e.g. ``"O-"``).

    Returns:
        ``True`` if the transfusion is compatible, ``False`` otherwise.
    """
    compatible = _COMPATIBILITY.get(recipient_type, [])
    return donor_type in compatible


def get_compatible_donors(recipient_type: str) -> List[str]:
    """Return a list of blood types that can donate to the given recipient type.

    Args:
        recipient_type: The blood type of the recipient.

    Returns:
        List of compatible donor blood types.
    """
    return list(_COMPATIBILITY.get(recipient_type, []))


def get_compatible_recipients(donor_type: str) -> List[str]:
    """Return a list of blood types that can receive from the given donor type.

    Args:
        donor_type: The blood type of the donor.

    Returns:
        List of blood types that can receive from the donor.
    """
    recipients: List[str] = []
    for recipient, donors in _COMPATIBILITY.items():
        if donor_type in donors:
            recipients.append(recipient)
    return recipients
