"""Blood inventory data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate

VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
VALID_STATUSES = ["available", "reserved", "expired", "used"]
VALID_COMPONENTS = ["whole_blood", "rbc", "plasma", "platelets"]


class InventorySchema(Schema):
    """Schema for validating blood inventory data."""

    bloodType = fields.Str(
        required=True, validate=validate.OneOf(VALID_BLOOD_TYPES)
    )
    units = fields.Int(required=True, validate=validate.Range(min=1))
    collectionDate = fields.Str(required=True)
    expiryDate = fields.Str(load_default=None)
    donorId = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(
        load_default="available", validate=validate.OneOf(VALID_STATUSES)
    )
    component = fields.Str(
        required=True, validate=validate.OneOf(VALID_COMPONENTS)
    )
    addedBy = fields.Str(load_default=None)
    notes = fields.Str(load_default="", validate=validate.Length(max=1000))
    createdAt = fields.Raw(load_default=None)
    updatedAt = fields.Raw(load_default=None)


class InventoryUpdateSchema(Schema):
    """Schema for validating blood inventory updates."""

    bloodType = fields.Str(validate=validate.OneOf(VALID_BLOOD_TYPES))
    units = fields.Int(validate=validate.Range(min=1))
    collectionDate = fields.Str()
    expiryDate = fields.Str()
    donorId = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(VALID_STATUSES))
    component = fields.Str(validate=validate.OneOf(VALID_COMPONENTS))
    notes = fields.Str(validate=validate.Length(max=1000))
    updatedAt = fields.Raw(load_default=None)
