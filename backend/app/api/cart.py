"""Cart endpoints.

The cart is keyed by an authenticated user when a JWT is present, otherwise by
an anonymous ``X-Session-Id`` header so guests can shop before signing in.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import CartItem, Product
from ..utils.auth import current_user
from ..utils.errors import NotFoundError, ValidationError

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _owner_filter():
    user = current_user()
    if user:
        return CartItem.user_id == user.id
    session_id = request.headers.get("X-Session-Id")
    if not session_id:
        raise ValidationError("Missing session identifier for guest cart")
    return CartItem.session_id == session_id


def _owner_kwargs() -> dict:
    user = current_user()
    if user:
        return {"user_id": user.id}
    return {"session_id": request.headers.get("X-Session-Id")}


def _serialize_cart(items: list[CartItem], currency: str = "KES") -> dict:
    subtotal = 0.0
    serialized_items = []

    from ..utils.fx import convert_amount

    requested_currency = (currency or "KES").upper()

    for i in items:
        if not i.product:
            continue
        line_total = float(i.product.price) * i.quantity
        subtotal += line_total

        item_dict = i.to_dict()
        # Convert line price if present
        if item_dict.get("product") and "price" in item_dict["product"]:
            converted = convert_amount(
                float(item_dict["product"]["price"]), requested_currency
            )
            if converted is not None:
                item_dict["product"]["price"] = converted
                item_dict["product"]["currency"] = requested_currency
        if "lineTotal" in item_dict:
            converted_total = convert_amount(
                float(item_dict["lineTotal"]), requested_currency
            )
            if converted_total is not None:
                item_dict["lineTotal"] = converted_total
                item_dict["currency"] = requested_currency


        serialized_items.append(item_dict)

    converted_subtotal = convert_amount(subtotal, requested_currency)

    # If FX conversion is unavailable we must not lie about the currency.
    # Keep amounts in base KES and report currency as KES.
    response_currency = (
        requested_currency if converted_subtotal is not None else "KES"
    )

    return {
        "items": serialized_items,
        "subtotal": round(
            converted_subtotal if converted_subtotal is not None else subtotal, 2
        ),
        "itemCount": sum(i.quantity for i in items),
        "currency": response_currency,
    }





@cart_bp.get("")
@jwt_required(optional=True)
def get_cart():
    items = CartItem.query.filter(_owner_filter()).all()
    requested_currency = (request.args.get("currency") or "KES").upper()
    return jsonify(_serialize_cart(items, requested_currency)), 200



@cart_bp.post("/items")
@jwt_required(optional=True)
def add_item():
    data = request.get_json(silent=True) or {}
    product_id = data.get("productId")
    quantity = int(data.get("quantity") or 1)

    product = Product.query.get(product_id) if product_id else None
    if not product:
        raise NotFoundError("Product not found")
    if quantity < 1:
        raise ValidationError("Quantity must be at least 1")

    item = CartItem.query.filter(
        _owner_filter(), CartItem.product_id == product.id
    ).first()
    if item:
        item.quantity += quantity
    else:
        item = CartItem(product_id=product.id, quantity=quantity, **_owner_kwargs())
        db.session.add(item)
    db.session.commit()

    items = CartItem.query.filter(_owner_filter()).all()
    return jsonify(_serialize_cart(items)), 201


@cart_bp.patch("/items/<int:item_id>")
@jwt_required(optional=True)
def update_item(item_id: int):
    data = request.get_json(silent=True) or {}
    quantity = int(data.get("quantity") or 0)
    item = CartItem.query.filter(_owner_filter(), CartItem.id == item_id).first()
    if not item:
        raise NotFoundError("Cart item not found")
    if quantity <= 0:
        db.session.delete(item)
    else:
        item.quantity = quantity
    db.session.commit()
    items = CartItem.query.filter(_owner_filter()).all()
    return jsonify(_serialize_cart(items)), 200


@cart_bp.delete("/items/<int:item_id>")
@jwt_required(optional=True)
def remove_item(item_id: int):
    item = CartItem.query.filter(_owner_filter(), CartItem.id == item_id).first()
    if not item:
        raise NotFoundError("Cart item not found")
    db.session.delete(item)
    db.session.commit()
    items = CartItem.query.filter(_owner_filter()).all()
    return jsonify(_serialize_cart(items)), 200


@cart_bp.delete("/items")
@jwt_required(optional=True)
def clear_cart():
    """Delete all cart items for the current owner (JWT user or guest session)."""
    db.session.query(CartItem).filter(_owner_filter()).delete(synchronize_session=False)
    db.session.commit()
    return jsonify(_serialize_cart([])), 200

