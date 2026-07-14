"""Payment initiation endpoint.

Delegates to the gateway abstractions in ``services.payments``. In dev/CI the
providers return simulated references so the full checkout flow is testable
end-to-end without real credentials.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..models import Order
from ..services import payments
from ..utils.errors import NotFoundError, ValidationError

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.post("/initiate")
def initiate_payment():
    data = request.get_json(silent=True) or {}
    order_number = data.get("orderNumber")
    method = (data.get("method") or "mpesa").lower()

    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        raise NotFoundError("Order not found")

    if method == "mpesa":
        phone = data.get("phone") or order.phone
        if not phone:
            raise ValidationError("Phone number is required for M-Pesa")
        result = payments.initiate_mpesa(float(order.total), phone, order.order_number)
    elif method == "stripe":
        result = payments.initiate_stripe(
            float(order.total), order.currency, order.order_number
        )
    elif method == "paypal":
        result = payments.initiate_paypal(
            float(order.total), order.currency, order.order_number
        )
    else:
        raise ValidationError(f"Unsupported payment method: {method}")

    order.payment_method = method
    order.payment_reference = result.reference
    from ..extensions import db

    db.session.commit()
    return jsonify(result.to_dict()), 200
