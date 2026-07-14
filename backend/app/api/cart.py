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


def _serialize_cart(items: list[CartItem]) -> dict:
    subtotal = sum(float(i.product.price) * i.quantity for i in items if i.product)
    return {
        "items": [i.to_dict() for i in items],
        "subtotal": round(subtotal, 2),
        "itemCount": sum(i.quantity for i in items),
    }


@cart_bp.get("")
@jwt_required(optional=True)
def get_cart():
    items = CartItem.query.filter(_owner_filter()).all()
    return jsonify(_serialize_cart(items)), 200


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
