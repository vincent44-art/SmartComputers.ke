"""Coupon validation endpoint."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..models import Coupon
from ..utils.errors import NotFoundError, ValidationError

coupons_bp = Blueprint("coupons", __name__, url_prefix="/api/coupons")


@coupons_bp.post("/validate")
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal") or 0)

    coupon = Coupon.query.filter_by(code=code).first()
    if not coupon:
        raise NotFoundError("Coupon not found")

    ok, reason = coupon.is_valid(subtotal)
    if not ok:
        raise ValidationError(reason)

    discount = coupon.compute_discount(subtotal)
    return (
        jsonify({"coupon": coupon.to_dict(), "discount": discount}),
        200,
    )
