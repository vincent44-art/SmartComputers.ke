"""User and address models."""
from __future__ import annotations

from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from .base import TimestampMixin


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(120), nullable=False, default="")
    last_name = db.Column(db.String(120), nullable=False, default="")
    phone = db.Column(db.String(32), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="customer")  # customer|admin
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    loyalty_points = db.Column(db.Integer, nullable=False, default=0)

    addresses = db.relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    orders = db.relationship("Order", back_populates="user")
    reviews = db.relationship("Review", back_populates="user")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "fullName": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "loyaltyPoints": self.loyalty_points,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Address(TimestampMixin, db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    label = db.Column(db.String(60), nullable=False, default="Home")
    recipient = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    line1 = db.Column(db.String(255), nullable=False)
    line2 = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(120), nullable=False)
    county = db.Column(db.String(120), nullable=True)
    postal_code = db.Column(db.String(32), nullable=True)
    country = db.Column(db.String(120), nullable=False, default="Kenya")
    is_default = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship("User", back_populates="addresses")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "label": self.label,
            "recipient": self.recipient,
            "phone": self.phone,
            "line1": self.line1,
            "line2": self.line2,
            "city": self.city,
            "county": self.county,
            "postalCode": self.postal_code,
            "country": self.country,
            "isDefault": self.is_default,
        }
