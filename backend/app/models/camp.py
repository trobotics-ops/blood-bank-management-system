"""Blood donation camp data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate

VALID_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"]


class CampSchema(Schema):
    """Schema for validating camp creation data."""

    name = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    venue = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    address = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    city = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    date = fields.Str(required=True)
    startTime = fields.Str(required=True)
    endTime = fields.Str(required=True)
    organizer = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    capacity = fields.Int(required=True, validate=validate.Range(min=1))
    description = fields.Str(load_default="", validate=validate.Length(max=2000))
    registeredDonors = fields.List(fields.Str(), load_default=[])
    status = fields.Str(
        load_default="upcoming", validate=validate.OneOf(VALID_STATUSES)
    )
    unitsCollected = fields.Int(load_default=0)
    createdBy = fields.Str(load_default=None)
    createdAt = fields.Raw(load_default=None)
    updatedAt = fields.Raw(load_default=None)


class CampUpdateSchema(Schema):
    """Schema for validating camp updates."""

    name = fields.Str(validate=validate.Length(min=1, max=300))
    venue = fields.Str(validate=validate.Length(min=1, max=300))
    address = fields.Str(validate=validate.Length(min=1, max=500))
    city = fields.Str(validate=validate.Length(min=1, max=100))
    date = fields.Str()
    startTime = fields.Str()
    endTime = fields.Str()
    organizer = fields.Str(validate=validate.Length(min=1, max=200))
    capacity = fields.Int(validate=validate.Range(min=1))
    description = fields.Str(validate=validate.Length(max=2000))
    status = fields.Str(validate=validate.OneOf(VALID_STATUSES))
    updatedAt = fields.Raw(load_default=None)
