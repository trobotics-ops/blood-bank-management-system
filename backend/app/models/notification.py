"""Notification data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate

VALID_TYPES = [
    "expiry_alert",
    "request_update",
    "camp_reminder",
    "low_stock",
    "general",
]
VALID_ENTITY_TYPES = ["request", "camp", "inventory"]


class NotificationSchema(Schema):
    """Schema for validating notification data."""

    recipientUid = fields.Str(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(VALID_TYPES))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    message = fields.Str(required=True, validate=validate.Length(min=1, max=2000))
    isRead = fields.Bool(load_default=False)
    relatedEntityType = fields.Str(
        load_default=None,
        allow_none=True,
        validate=validate.OneOf(VALID_ENTITY_TYPES + [None]),
    )
    relatedEntityId = fields.Str(load_default=None, allow_none=True)
    createdAt = fields.Raw(load_default=None)
