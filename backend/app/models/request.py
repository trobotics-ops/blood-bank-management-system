"""Blood request data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate

VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
VALID_URGENCY_LEVELS = ["normal", "urgent", "critical"]
VALID_STATUSES = ["pending", "approved", "fulfilled", "rejected"]


class RequestSchema(Schema):
    """Schema for validating blood request data."""

    requestedBy = fields.Str(load_default=None)
    hospitalName = fields.Str(
        required=True, validate=validate.Length(min=1, max=300)
    )
    contactPerson = fields.Str(
        required=True, validate=validate.Length(min=1, max=200)
    )
    contactPhone = fields.Str(
        required=True, validate=validate.Length(min=7, max=20)
    )
    bloodType = fields.Str(
        required=True, validate=validate.OneOf(VALID_BLOOD_TYPES)
    )
    unitsNeeded = fields.Int(required=True, validate=validate.Range(min=1))
    urgencyLevel = fields.Str(
        load_default="normal", validate=validate.OneOf(VALID_URGENCY_LEVELS)
    )
    patientName = fields.Str(
        required=True, validate=validate.Length(min=1, max=200)
    )
    patientAge = fields.Int(required=True, validate=validate.Range(min=0, max=150))
    reason = fields.Str(load_default="", validate=validate.Length(max=1000))
    status = fields.Str(
        load_default="pending", validate=validate.OneOf(VALID_STATUSES)
    )
    rejectionReason = fields.Str(load_default=None, allow_none=True)
    approvedBy = fields.Str(load_default=None, allow_none=True)
    fulfilledAt = fields.Raw(load_default=None, allow_none=True)
    createdAt = fields.Raw(load_default=None)
    updatedAt = fields.Raw(load_default=None)
