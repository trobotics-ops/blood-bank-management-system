"""User data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate, pre_load

VALID_ROLES = ["admin", "hospital", "donor"]


class UserSchema(Schema):
    """Schema for validating user data."""

    email = fields.Email(required=True)
    displayName = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    role = fields.Str(required=True, validate=validate.OneOf(VALID_ROLES))
    phone = fields.Str(load_default="", validate=validate.Length(max=20))
    organizationName = fields.Str(load_default="", validate=validate.Length(max=300))
    createdAt = fields.Raw(load_default=None)
    updatedAt = fields.Raw(load_default=None)


class UserUpdateSchema(Schema):
    """Schema for validating user profile updates."""

    displayName = fields.Str(validate=validate.Length(min=1, max=200))
    phone = fields.Str(validate=validate.Length(max=20))
    organizationName = fields.Str(validate=validate.Length(max=300))
    updatedAt = fields.Raw(load_default=None)
