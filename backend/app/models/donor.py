"""Donor data schema and validation using Marshmallow."""

from marshmallow import Schema, fields, validate

VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
VALID_GENDERS = ["male", "female", "other"]


class DonorSchema(Schema):
    """Schema for validating donor registration data."""

    uid = fields.Str(load_default=None)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True)
    phone = fields.Str(required=True, validate=validate.Length(min=7, max=20))
    bloodType = fields.Str(
        required=True, validate=validate.OneOf(VALID_BLOOD_TYPES)
    )
    dateOfBirth = fields.Str(required=True)
    gender = fields.Str(required=True, validate=validate.OneOf(VALID_GENDERS))
    address = fields.Str(load_default="", validate=validate.Length(max=500))
    city = fields.Str(load_default="", validate=validate.Length(max=100))
    state = fields.Str(load_default="", validate=validate.Length(max=100))
    medicalHistory = fields.Str(load_default="", validate=validate.Length(max=2000))
    lastDonationDate = fields.Str(load_default=None, allow_none=True)
    isEligible = fields.Bool(load_default=True)
    totalDonations = fields.Int(load_default=0)
    createdAt = fields.Raw(load_default=None)
    updatedAt = fields.Raw(load_default=None)


class DonorUpdateSchema(Schema):
    """Schema for validating donor profile updates."""

    name = fields.Str(validate=validate.Length(min=1, max=200))
    phone = fields.Str(validate=validate.Length(min=7, max=20))
    bloodType = fields.Str(validate=validate.OneOf(VALID_BLOOD_TYPES))
    dateOfBirth = fields.Str()
    gender = fields.Str(validate=validate.OneOf(VALID_GENDERS))
    address = fields.Str(validate=validate.Length(max=500))
    city = fields.Str(validate=validate.Length(max=100))
    state = fields.Str(validate=validate.Length(max=100))
    medicalHistory = fields.Str(validate=validate.Length(max=2000))
    lastDonationDate = fields.Str(allow_none=True)
    isEligible = fields.Bool()
    totalDonations = fields.Int()
    updatedAt = fields.Raw(load_default=None)
