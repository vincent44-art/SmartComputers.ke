"""Product review endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Product, Review
from ..utils.auth import current_user
from ..utils.errors import NotFoundError, ValidationError

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/products")


@reviews_bp.get("/<slug>/reviews")
def list_reviews(slug: str):
    product = Product.query.filter_by(slug=slug).first()
    if not product:
        raise NotFoundError("Product not found")
    reviews = [r.to_dict() for r in product.reviews if r.is_approved]
    return jsonify(reviews), 200


@reviews_bp.post("/<slug>/reviews")
@jwt_required()
def create_review(slug: str):
    product = Product.query.filter_by(slug=slug).first()
    if not product:
        raise NotFoundError("Product not found")

    data = request.get_json(silent=True) or {}
    rating = int(data.get("rating") or 0)
    if rating < 1 or rating > 5:
        raise ValidationError("Rating must be between 1 and 5")

    user = current_user()
    review = Review(
        product_id=product.id,
        user_id=user.id,
        rating=rating,
        title=(data.get("title") or "").strip() or None,
        body=(data.get("body") or "").strip() or None,
    )
    db.session.add(review)
    db.session.flush()
    product.recompute_rating()
    db.session.commit()
    return jsonify(review.to_dict()), 201
