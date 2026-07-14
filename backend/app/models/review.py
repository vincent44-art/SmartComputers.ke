"""Product review model."""
from __future__ import annotations

from ..extensions import db
from .base import TimestampMixin


class Review(TimestampMixin, db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(200), nullable=True)
    body = db.Column(db.Text, nullable=True)
    is_approved = db.Column(db.Boolean, nullable=False, default=True)

    product = db.relationship("Product", back_populates="reviews")
    user = db.relationship("User", back_populates="reviews")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "productId": self.product_id,
            "rating": self.rating,
            "title": self.title,
            "body": self.body,
            "author": self.user.full_name if self.user else "Anonymous",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
