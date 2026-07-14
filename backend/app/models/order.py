"""Order and order-item models."""
from __future__ import annotations

import uuid

from ..extensions import db
from .base import TimestampMixin


def generate_order_number() -> str:
    return "SC-" + uuid.uuid4().hex[:10].upper()


class Order(TimestampMixin, db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(
        db.String(20), unique=True, nullable=False, default=generate_order_number
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(32), nullable=True)

    status = db.Column(db.String(20), nullable=False, default="pending")
    # pending|paid|processing|shipped|delivered|cancelled|refunded
    payment_method = db.Column(db.String(20), nullable=True)  # mpesa|stripe|paypal|cod
    payment_status = db.Column(db.String(20), nullable=False, default="unpaid")
    payment_reference = db.Column(db.String(120), nullable=True)

    subtotal = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    shipping = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    tax = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    currency = db.Column(db.String(3), nullable=False, default="KES")
    coupon_code = db.Column(db.String(40), nullable=True)

    shipping_address = db.Column(db.JSON, nullable=True)
    billing_address = db.Column(db.JSON, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    user = db.relationship("User", back_populates="orders")
    items = db.relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )

    def to_dict(self, detail: bool = False) -> dict:
        data = {
            "id": self.id,
            "orderNumber": self.order_number,
            "status": self.status,
            "paymentMethod": self.payment_method,
            "paymentStatus": self.payment_status,
            "subtotal": float(self.subtotal),
            "discount": float(self.discount),
            "shipping": float(self.shipping),
            "tax": float(self.tax),
            "total": float(self.total),
            "currency": self.currency,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "itemCount": len(self.items),
        }
        if detail:
            data.update(
                {
                    "email": self.email,
                    "phone": self.phone,
                    "couponCode": self.coupon_code,
                    "shippingAddress": self.shipping_address,
                    "billingAddress": self.billing_address,
                    "notes": self.notes,
                    "items": [item.to_dict() for item in self.items],
                }
            )
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)

    product_name = db.Column(db.String(255), nullable=False)
    sku = db.Column(db.String(60), nullable=True)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    thumbnail = db.Column(db.String(500), nullable=True)

    order = db.relationship("Order", back_populates="items")

    @property
    def line_total(self) -> float:
        return float(self.unit_price) * self.quantity

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "productId": self.product_id,
            "productName": self.product_name,
            "sku": self.sku,
            "unitPrice": float(self.unit_price),
            "quantity": self.quantity,
            "thumbnail": self.thumbnail,
            "lineTotal": self.line_total,
        }
