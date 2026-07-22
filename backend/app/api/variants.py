"""Product variant endpoints.

Provides variant data to the frontend so customers can configure products
from the cart and product detail pages.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Product, ProductVariant
from ..utils.errors import NotFoundError
from ..utils.fx import convert_amount

variants_bp = Blueprint("variants", __name__, url_prefix="/api/variants")


@variants_bp.get("/product/<int:product_id>")
def list_product_variants(product_id: int):
    """Return all active variants for a product, with optional currency conversion."""
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError("Product not found")

    requested_currency = (request.args.get("currency") or "KES").upper()
    variants = (
        ProductVariant.query.filter(
            ProductVariant.product_id == product_id,
            ProductVariant.is_active.is_(True),
        )
        .order_by(ProductVariant.price)
        .all()
    )

    def serialize(v: ProductVariant):
        data = v.to_dict()
        if requested_currency and requested_currency != "KES":
            converted = convert_amount(v.price, requested_currency)
            if converted is not None:
                data["price"] = converted
        return data

    return jsonify([serialize(v) for v in variants]), 200


@variants_bp.get("/<int:variant_id>")
def get_variant(variant_id: int):
    """Return a single variant by ID."""
    variant = ProductVariant.query.get(variant_id)
    if not variant or not variant.is_active:
        raise NotFoundError("Variant not found")

    data = variant.to_dict()
    requested_currency = (request.args.get("currency") or "KES").upper()
    if requested_currency and requested_currency != "KES":
        converted = convert_amount(variant.price, requested_currency)
        if converted is not None:
            data["price"] = converted

    return jsonify(data), 200


@variants_bp.get("/<int:product_id>/check-stock")
def check_variant_stock(product_id: int):
    """Quick stock check for a specific variant combination.

    Query params: ram, storage, processor, color
    Returns the variant ID and stock level, or 404 if no match.
    """
    attributes = {}
    for attr in ("ram", "storage", "processor", "color"):
        val = request.args.get(attr)
        if val:
            attributes[attr] = val

    if not attributes:
        return jsonify({"error": "At least one attribute filter is required"}), 400

    variant = ProductVariant.query.filter(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active.is_(True),
    ).all()

    # Find exact attribute match
    for v in variant:
        v_attrs = (v.attributes or {})
        match = all(
            v_attrs.get(k, "").lower() == v.lower()
            for k, v in attributes.items()
        )
        if match:
            return jsonify({
                "variantId": v.id,
                "stock": v.stock,
                "inStock": v.in_stock,
            }), 200

    return jsonify({"inStock": False, "stock": 0}), 200


def register_variants_api(app) -> None:
    """Register the variants blueprint (called from api/__init__.py)."""
    app.register_blueprint(variants_bp)

