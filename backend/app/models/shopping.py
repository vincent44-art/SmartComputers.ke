"""Cart, wishlist and coupon models."""
from __future__ import annotations

from datetime import datetime

from ..extensions import db
from .base import TimestampMixin


class CartItem(TimestampMixin, db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    session_id = db.Column(db.String(120), nullable=True, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    variant_id = db.Column(
        db.Integer, db.ForeignKey("product_variants.id"), nullable=True
    )
    quantity = db.Column(db.Integer, nullable=False, default=1)
    # Snapshot of the selected variant attributes at time of selection
    variant_data = db.Column(db.JSON, nullable=True)

    product = db.relationship("Product")
    variant = db.relationship("ProductVariant")

    def to_dict(self) -> dict:
        unit_price = float(self.variant.price) if self.variant else float(self.product.price)
        line_total = unit_price * self.quantity

        result = {
            "id": self.id,
            "productId": self.product_id,
            "variantId": self.variant_id,
            "quantity": self.quantity,
            "product": self.product.to_dict() if self.product else None,
            "variantData": (self.variant.attributes if self.variant else self.variant_data) or {},
            "variantImage": self.variant.image_url if self.variant else None,
            "unitPrice": unit_price,
            "lineTotal": line_total,
        }
        # Override product price with variant price for downstream consistency
        if result["product"] and self.variant:
            result["product"]["price"] = unit_price
        return result


class WishlistItem(TimestampMixin, db.Model):
    __tablename__ = "wishlist_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)

    product = db.relationship("Product")

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "productId": self.product_id,
            "product": self.product.to_dict() if self.product else None,
        }


class Coupon(TimestampMixin, db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    discount_type = db.Column(db.String(12), nullable=False, default="percent")  # percent|fixed
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    min_subtotal = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    usage_limit = db.Column(db.Integer, nullable=True)
    used_count = db.Column(db.Integer, nullable=False, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def is_valid(self, subtotal: float) -> tuple[bool, str]:
        if not self.is_active:
            return False, "Coupon is not active"
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False, "Coupon has expired"
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return False, "Coupon usage limit reached"
        if subtotal < float(self.min_subtotal):
            return False, f"Minimum spend of {self.min_subtotal} required"
        return True, ""

    def compute_discount(self, subtotal: float) -> float:
        if self.discount_type == "percent":
            return round(subtotal * float(self.amount) / 100, 2)
        return min(float(self.amount), subtotal)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discountType": self.discount_type,
            "amount": float(self.amount),
            "minSubtotal": float(self.min_subtotal),
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
        }
