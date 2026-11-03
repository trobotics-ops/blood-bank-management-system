"""Email notification service using Flask-Mail with Gmail SMTP.

All send functions handle errors gracefully — they log failures but never
crash the calling code.
"""

import logging
from typing import Optional

from flask import current_app
from flask_mail import Message

logger = logging.getLogger(__name__)


def _get_mail():
    """Retrieve the Flask-Mail instance from the current app."""
    return current_app.extensions.get("mail")


def send_email(
    subject: str,
    recipients: list[str],
    body: str,
    html: Optional[str] = None,
) -> bool:
    """Send an email via Flask-Mail.

    Args:
        subject: Email subject line.
        recipients: List of recipient email addresses.
        body: Plain-text body.
        html: Optional HTML body.

    Returns:
        ``True`` if the email was sent successfully, ``False`` otherwise.
    """
    mail = _get_mail()
    if mail is None:
        logger.warning("Flask-Mail is not initialised; skipping email send.")
        return False

    try:
        msg = Message(subject=subject, recipients=recipients, body=body, html=html)
        mail.send(msg)
        logger.info("Email sent to %s: %s", recipients, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", recipients, exc)
        return False


def send_expiry_alert(admin_email: str, unit_id: str, blood_type: str, expiry_date: str) -> bool:
    """Send an alert about an expiring blood unit.

    Args:
        admin_email: Administrator email address.
        unit_id: The Firestore document ID of the blood unit.
        blood_type: The blood type of the unit.
        expiry_date: The expiry date string (YYYY-MM-DD).

    Returns:
        ``True`` if sent successfully.
    """
    subject = f"Blood Unit Expiry Alert – {blood_type} (Unit {unit_id})"
    body = (
        f"Dear Administrator,\n\n"
        f"The following blood unit is expiring soon:\n\n"
        f"  Unit ID:     {unit_id}\n"
        f"  Blood Type:  {blood_type}\n"
        f"  Expiry Date: {expiry_date}\n\n"
        f"Please take the necessary action to use or dispose of this unit.\n\n"
        f"– Blood Bank Management System"
    )
    return send_email(subject, [admin_email], body)


def send_request_update(
    recipient_email: str,
    request_id: str,
    status: str,
    blood_type: str,
    rejection_reason: Optional[str] = None,
) -> bool:
    """Notify a hospital about a blood request status change.

    Args:
        recipient_email: Hospital contact email.
        request_id: The Firestore document ID of the request.
        status: New status (approved / rejected / fulfilled).
        blood_type: Requested blood type.
        rejection_reason: Reason for rejection, if applicable.

    Returns:
        ``True`` if sent successfully.
    """
    subject = f"Blood Request {status.capitalize()} – {blood_type} (#{request_id})"
    body = (
        f"Dear Hospital Contact,\n\n"
        f"Your blood request (ID: {request_id}) for {blood_type} has been "
        f"{status}.\n"
    )
    if status == "rejected" and rejection_reason:
        body += f"\nReason: {rejection_reason}\n"
    body += "\n– Blood Bank Management System"
    return send_email(subject, [recipient_email], body)


def send_camp_reminder(
    recipient_email: str,
    camp_name: str,
    camp_date: str,
    venue: str,
) -> bool:
    """Send a reminder about an upcoming blood donation camp.

    Args:
        recipient_email: Donor email address.
        camp_name: Name of the camp.
        camp_date: Date string (YYYY-MM-DD).
        venue: Camp venue.

    Returns:
        ``True`` if sent successfully.
    """
    subject = f"Reminder: Blood Donation Camp – {camp_name}"
    body = (
        f"Dear Donor,\n\n"
        f"This is a friendly reminder about the upcoming blood donation camp:\n\n"
        f"  Camp:  {camp_name}\n"
        f"  Date:  {camp_date}\n"
        f"  Venue: {venue}\n\n"
        f"We look forward to seeing you there!\n\n"
        f"– Blood Bank Management System"
    )
    return send_email(subject, [recipient_email], body)
