"""Recommendation endpoints.

Provides personalised product recommendations for the cart page based on
category, brand, price similarity, popularity and trending signals.
"""
from __future__ import annotations

import time
from functools import lru_cache

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models import CartItem, OrderItem, Product
from ..utils.auth import current_user
from ..utils.errors import ValidationError
from ..utils.fx import convert_amount

recommendations_bp = Blueprint(
    "recommendations", __name__, url_prefix="/api/recommendations"
)

# ---------------------------------------------------------------------------
# Scoring constants
# ---------------------------------------------------------------------------
SCORE_SAME_CATEGORY = 40
SCORE_SAME_BRAND = 30
SCORE_FREQUENTLY_BOUGHT = 20
SCORE_SIMILAR_PRICE = 15
SCORE_BEST_SELLER = 10
SCORE_TRENDING = 5

CACHE_DURATION = 600  # 10 minutes


def _get_cart_product_ids() -> set[int]:
    """Return the set of product ids currently in the user's/session's cart."""
    user = current_user()
    if user:
        items = CartItem.query.filter(CartItem.user_id == user.id).all()
    else:
        session_id = request.headers.get("X-Session-Id")
        if not session_id:
            return set()
        items = CartItem.query.filter(CartItem.session_id == session_id).all()
    return {i.product_id for i in items}


def _get_cart_categories() -> dict[int, int]:
    """Return category_id -> count mapping from cart items."""
    user = current_user()
    if user:
        items = CartItem.query.filter(CartItem.user_id == user.id).all()
    else:
        session_id = request.headers.get("X-Session-Id")
        if not session_id:
            return {}
        items = CartItem.query.filter(CartItem.session_id == session_id).all()

    counts: dict[int, int] = {}
    for item in items:
        if item.product and item.product.category_id:
            counts[item.product.category_id] = (
                counts.get(item.product.category_id, 0) + 1
            )
    return counts


def _get_cart_brands() -> dict[int, int]:
    """Return brand_id -> count mapping from cart items."""
    user = current_user()
    if user:
        items = CartItem.query.filter(CartItem.user_id == user.id).all()
    else:
        session_id = request.headers.get("X-Session-Id")
        if not session_id:
            return {}
        items = CartItem.query.filter(CartItem.session_id == session_id).all()

    counts: dict[int, int] = {}
    for item in items:
        if item.product and item.product.brand_id:
            counts[item.product.brand_id] = (
                counts.get(item.product.brand_id, 0) + 1
            )
    return counts


def _get_cart_price_range() -> tuple[float, float]:
    """Return (min_price, max_price) ±20% from cart items."""
    user = current_user()
    if user:
        items = CartItem.query.filter(CartItem.user_id == user.id).all()
    else:
        session_id = request.headers.get("X-Session-Id")
        if not session_id:
            return (0, 0)
        items = CartItem.query.filter(CartItem.session_id == session_id).all()

    prices = [
        float(item.product.price)
        for item in items
        if item.product and item.product.price
    ]
    if not prices:
        return (0, 0)

    avg_price = sum(prices) / len(prices)
    return (avg_price * 0.8, avg_price * 1.2)


def _get_frequently_bought_ids() -> set[int]:
    """Get product ids frequently bought together with cart products."""
    cart_ids = _get_cart_product_ids()
    if not cart_ids:
        return set()

    # Find orders that contained any of the cart products
    frequently_bought = (
        db.session.query(OrderItem.product_id)
        .filter(
            OrderItem.order_id.in_(
                db.session.query(OrderItem.order_id).filter(
                    OrderItem.product_id.in_(cart_ids)
                )
            ),
            ~OrderItem.product_id.in_(cart_ids),
        )
        .group_by(OrderItem.product_id)
        .order_by(func.count(OrderItem.id).desc())
        .limit(20)
        .all()
    )
    return {row[0] for row in frequently_bought}


def _score_product(
    product: Product,
    cart_categories: dict[int, int],
    cart_brands: dict[int, int],
    price_min: float,
    price_max: float,
    frequently_bought: set[int],
) -> int:
    """Compute a recommendation score for a single product."""
    score = 0

    # Same category
    if product.category_id and product.category_id in cart_categories:
        score += SCORE_SAME_CATEGORY * min(
            cart_categories[product.category_id], 3
        )

    # Same brand
    if product.brand_id and product.brand_id in cart_brands:
        score += SCORE_SAME_BRAND * min(cart_brands[product.brand_id], 3)

    # Frequently bought together
    if product.id in frequently_bought:
        score += SCORE_FREQUENTLY_BOUGHT

    # Similar price range
    if price_min > 0 and price_max > 0:
        product_price = float(product.price)
        if price_min <= product_price <= price_max:
            score += SCORE_SIMILAR_PRICE

    # Best seller
    if product.is_best_seller:
        score += SCORE_BEST_SELLER

    # Trending (high rating + recent activity)
    if product.rating_avg >= 4.0 and product.rating_count >= 5:
        score += SCORE_TRENDING

    return score


@recommendations_bp.get("/cart")
@jwt_required(optional=True)
def get_cart_recommendations():
    """Return scored product recommendations based on the user's cart."""
    cart_ids = _get_cart_product_ids()
    cart_categories = _get_cart_categories()
    cart_brands = _get_cart_brands()
    price_min, price_max = _get_cart_price_range()
    frequently_bought = _get_frequently_bought_ids()

    requested_currency = (request.args.get("currency") or "KES").upper()

    # Base query: exclude cart items, out of stock
    query = Product.query.filter(
        Product.id.notin_(cart_ids) if cart_ids else True,
        Product.stock > 0,
    )

    products = query.all()

    # Score each product
    scored = []
    for product in products:
        score = _score_product(
            product,
            cart_categories,
            cart_brands,
            price_min,
            price_max,
            frequently_bought,
        )
        scored.append((score, product))

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)

    # Take top 12
    top_products = scored[:12]

    # If no scored matches, fallback to popular products
    if not top_products or all(s == 0 for s, _ in top_products):
        fallback = (
            Product.query.filter(
                Product.id.notin_(cart_ids) if cart_ids else True,
                Product.stock > 0,
            )
            .order_by(Product.rating_avg.desc(), Product.rating_count.desc())
            .limit(12)
            .all()
        )
        # Build response with zero scores
        serialized = []
        for p in fallback:
            pd = p.to_dict()
            if requested_currency and requested_currency != "KES":
                converted_price = convert_amount(float(p.price), requested_currency)
                if converted_price is not None:
                    pd["price"] = converted_price
                if p.compare_at_price is not None:
                    converted_compare = convert_amount(
                        float(p.compare_at_price), requested_currency
                    )
                    if converted_compare is not None:
                        pd["compareAtPrice"] = converted_compare
                pd["currency"] = requested_currency
            serialized.append(
                {
                    "product": pd,
                    "score": 0,
                    "reason": "popular",
                }
            )
        return jsonify({"products": serialized, "fallback": True}), 200

    # Serialize scored results
    serialized = []
    for score, product in top_products:
        pd = product.to_dict()
        if requested_currency and requested_currency != "KES":
            converted_price = convert_amount(float(product.price), requested_currency)
            if converted_price is not None:
                pd["price"] = converted_price
            if product.compare_at_price is not None:
                converted_compare = convert_amount(
                    float(product.compare_at_price), requested_currency
                )
                if converted_compare is not None:
                    pd["compareAtPrice"] = converted_compare
            pd["currency"] = requested_currency

        # Determine reason
        reason_parts = []
        if product.category_id and product.category_id in cart_categories:
            reason_parts.append("same_category")
        if product.brand_id and product.brand_id in cart_brands:
            reason_parts.append("same_brand")
        if product.id in frequently_bought:
            reason_parts.append("frequently_bought")
        if price_min > 0 and price_max > 0 and price_min <= float(product.price) <= price_max:
            reason_parts.append("similar_price")
        if product.is_best_seller:
            reason_parts.append("best_seller")
        if product.rating_avg >= 4.0 and product.rating_count >= 5:
            reason_parts.append("trending")

        serialized.append(
            {
                "product": pd,
                "score": score,
                "reason": reason_parts[0] if reason_parts else "popular",
            }
        )

    return jsonify({"products": serialized, "fallback": False}), 200


@recommendations_bp.post("/click")
@jwt_required(optional=True)
def track_click():
    """Track a recommendation product click for analytics."""
    data = request.get_json(silent=True) or {}
    product_id = data.get("productId")
    position = data.get("position", 0)

    if not product_id:
        raise ValidationError("productId is required")

    # In production, log to a timeseries DB or analytics service.
    # For now, log to stdout.
    print(
        f"[ANALYTICS] recommended_product_clicked - product={product_id} "
        f"position={position}"
    )

    return jsonify({"ok": True}), 200


@recommendations_bp.post("/added")
@jwt_required(optional=True)
def track_added():
    """Track a recommendation product added to cart for analytics."""
    data = request.get_json(silent=True) or {}
    product_id = data.get("productId")
    position = data.get("position", 0)

    if not product_id:
        raise ValidationError("productId is required")

    print(
        f"[ANALYTICS] recommended_product_added - product={product_id} "
        f"position={position}"
    )

    return jsonify({"ok": True}), 200

