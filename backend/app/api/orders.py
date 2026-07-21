"""Checkout and order endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Coupon, Order, OrderItem, Product
from ..utils.auth import current_user
from ..utils.errors import NotFoundError, ValidationError
from ..utils.fx import convert_amount

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


TAX_RATE = 0.16  # Kenya VAT
FREE_SHIPPING_THRESHOLD = 100_000
STANDARD_SHIPPING = 500


def _compute_totals(items: list[dict], coupon_code: str | None):
    resolved = []
    subtotal = 0.0
    for entry in items:
        product = Product.query.get(entry.get("productId"))
        if not product:
            raise NotFoundError(f"Product {entry.get('productId')} not found")
        quantity = int(entry.get("quantity") or 1)
        if quantity < 1:
            raise ValidationError("Quantity must be at least 1")
        if product.stock < quantity:
            raise ValidationError(f"Insufficient stock for {product.name}")
        subtotal += float(product.price) * quantity
        resolved.append((product, quantity))

    discount = 0.0
    coupon = None
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code.strip().upper()).first()
        if coupon:
            ok, reason = coupon.is_valid(subtotal)
            if not ok:
                raise ValidationError(reason)
            discount = coupon.compute_discount(subtotal)

    shipping = 0 if subtotal >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING
    taxable = max(subtotal - discount, 0)
    tax = round(taxable * TAX_RATE, 2)
    total = round(taxable + shipping + tax, 2)
    return resolved, subtotal, discount, shipping, tax, total, coupon



@orders_bp.post("")
@jwt_required(optional=True)
def create_order():
    data = request.get_json(silent=True) or {}

    requested_currency = (request.args.get("currency") or "KES").upper().strip()

    items = data.get("items") or []
    if not items:
        raise ValidationError("Cannot create an order with no items")

    email = (data.get("email") or "").strip().lower()
    if not email or "@" not in email:
        raise ValidationError("A valid email is required")

    resolved, subtotal, discount, shipping, tax, total, coupon = _compute_totals(
        items, data.get("couponCode")
    )

    # Convert money amounts for response only.
    # Keep DB stored values in base KES.
    currency = requested_currency
    subtotal_c = convert_amount(subtotal, currency)
    discount_c = convert_amount(discount, currency)
    shipping_c = convert_amount(float(shipping), currency)
    tax_c = convert_amount(tax, currency)
    total_c = convert_amount(total, currency)


    user = current_user()
    order = Order(
        user_id=user.id if user else None,
        email=email,
        phone=(data.get("phone") or "").strip() or None,
        payment_method=data.get("paymentMethod", "mpesa"),
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        tax=tax,
        total=total,
        coupon_code=coupon.code if coupon else None,
        shipping_address=data.get("shippingAddress"),
        billing_address=data.get("billingAddress") or data.get("shippingAddress"),
        notes=data.get("notes"),
    )

    for product, quantity in resolved:
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                sku=product.sku,
                unit_price=product.price,
                quantity=quantity,
                thumbnail=product.images[0].url if product.images else None,
            )
        )
        product.stock -= quantity

    if coupon:
        coupon.used_count += 1

    db.session.add(order)
    db.session.commit()

    # Convert only for the response.
    # If rates are unavailable, we fall back to base KES values (no None).
    resp = order.to_dict(detail=True)
    currency = requested_currency
    resp["currency"] = currency
    resp["subtotal"] = subtotal_c if subtotal_c is not None else resp.get("subtotal")
    resp["discount"] = discount_c if discount_c is not None else resp.get("discount")
    resp["shipping"] = shipping_c if shipping_c is not None else resp.get("shipping")
    resp["tax"] = tax_c if tax_c is not None else resp.get("tax")
    resp["total"] = total_c if total_c is not None else resp.get("total")

    # Convert order item unit_price values (response only).
    for it in resp.get("items", []) or []:
        try:
            unit_kes = it.get("unitPrice")
            if unit_kes is not None:
                converted = convert_amount(float(unit_kes), currency)
                if converted is not None:
                    it["unitPrice"] = converted
        except Exception:
            continue

    return jsonify(resp), 201



@orders_bp.get("")
@jwt_required()
def list_orders():
    user = current_user()
    orders = (
        Order.query.filter_by(user_id=user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify([o.to_dict() for o in orders]), 200


@orders_bp.get("/<order_number>")
@jwt_required(optional=True)
def get_order(order_number: str):
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        raise NotFoundError("Order not found")
    user = current_user()
    if order.user_id and (not user or user.id != order.user_id):
        raise NotFoundError("Order not found")
    return jsonify(order.to_dict(detail=True)), 200
