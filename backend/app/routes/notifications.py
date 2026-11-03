"""Notification routes — retrieve and manage user notifications."""

import logging

from flask import Blueprint, request, jsonify

from app.auth import require_auth
from app.services import notification_service

logger = logging.getLogger(__name__)

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.route("", methods=["GET"])
@require_auth
def get_notifications():
    """Get the authenticated user's notifications.

    Query Parameters:
        limit (int, optional): Max results (default 50).

    Returns:
        200: List of notifications.
    """
    uid = request.user["uid"]
    limit = request.args.get("limit", 50, type=int)

    notifications = notification_service.get_notifications_for_user(uid, limit=limit)
    return jsonify(notifications), 200


@notifications_bp.route("/unread-count", methods=["GET"])
@require_auth
def get_unread_count():
    """Get the count of unread notifications for the authenticated user.

    Returns:
        200: { "unreadCount": <int> }
    """
    uid = request.user["uid"]
    count = notification_service.get_unread_count(uid)
    return jsonify({"unreadCount": count}), 200


@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@require_auth
def mark_notification_read(notification_id: str):
    """Mark a notification as read.

    The notification must belong to the authenticated user.

    Returns:
        200: Updated notification.
        404: Notification not found or does not belong to user.
    """
    uid = request.user["uid"]

    notification = notification_service.mark_as_read(notification_id, uid)
    if not notification:
        return jsonify({"error": "Notification not found", "status": 404}), 404

    return jsonify(notification), 200
