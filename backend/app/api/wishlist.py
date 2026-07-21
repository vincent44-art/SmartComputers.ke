"""Wishlist endpoints (authenticated users)."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Product, WishlistItem
from ..utils.fx import convert_amount

from ..utils.auth import current_user
from ..utils.errors import NotFoundError

wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/api/wishlist")


@wishlist_bp.get("")
@jwt_required()
def get_wishlist():
    user = current_user()
    items = WishlistItem.query.filter_by(user_id=user.id).all()

    requested_currency = (request.args.get("currency") or "KES").upper().strip()

    resp_items = []
    for i in items:
        data = i.to_dict()

        # Convert product price fields if present in the wishlist item payload.
        # The WishlistItem.to_dict() shape depends on the model implementation.
        # We only convert when a numeric KES price exists.
        product = data.get("product")
        if product and "price" in product and product.get("price") is not None:
            converted = convert_amount(float(product["price"]), requested_currency)
            if converted is not None:
                product["price"] = converted
                product["currency"] = requested_currency

        if product and product.get("compareAtPrice") is not None:
            converted_compare = convert_amount(
                float(product["compareAtPrice"]), requested_currency
            )
            if converted_compare is not None:
                product["compareAtPrice"] = converted_compare
                product["currency"] = requested_currency

        data["currency"] = requested_currency
        resp_items.append(data)

    return jsonify(resp_items), 200



@wishlist_bp.post("")
@jwt_required()
def add_to_wishlist():
    user = current_user()
    data = request.get_json(silent=True) or {}
    product = Product.query.get(data.get("productId"))
    if not product:
        raise NotFoundError("Product not found")
    existing = WishlistItem.query.filter_by(
        user_id=user.id, product_id=product.id
    ).first()
    if not existing:
        db.session.add(WishlistItem(user_id=user.id, product_id=product.id))
        db.session.commit()
    items = WishlistItem.query.filter_by(user_id=user.id).all()
    return jsonify([i.to_dict() for i in items]), 201


@wishlist_bp.delete("/<int:product_id>")
@jwt_required()
def remove_from_wishlist(product_id: int):
    user = current_user()
    item = WishlistItem.query.filter_by(
        user_id=user.id, product_id=product_id
    ).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    items = WishlistItem.query.filter_by(user_id=user.id).all()
    return jsonify([i.to_dict() for i in items]), 200
