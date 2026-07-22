"""Product variant model for configurable products.

Each variant represents a unique combination of attributes (RAM, Storage,
Processor, Color) with its own SKU, price, stock level and optional image.
"""
from __future__ import annotations

from sqlalchemy import UniqueConstraint

from ..extensions import db
from .base import TimestampMixin


class ProductVariant(TimestampMixin, db.Model):
    __tablename__ = "product_variants"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id"), nullable=False, index=True
    )
    sku = db.Column(db.String(60), unique=True, nullable=False, index=True)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    # JSON object storing the attribute combination, e.g.:
    # {"ram": "16GB", "storage": "512GB SSD", "processor": "Intel Core i7", "color": "Silver"}
    attributes = db.Column(db.JSON, nullable=False, default=dict)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    product = db.relationship("Product", backref=db.backref("variants", lazy="dynamic"))

    __table_args__ = (
        UniqueConstraint("product_id", "sku", name="uq_variant_product_sku"),
    )

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "productId": self.product_id,
            "sku": self.sku,
            "price": float(self.price),
            "stock": self.stock,
            "inStock": self.in_stock,
            "attributes": self.attributes or {},
            "imageUrl": self.image_url,
            "isActive": self.is_active,
        }

