"""Category endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify

from ..models import Category
from ..utils.errors import NotFoundError

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
def list_categories():
    roots = Category.query.filter_by(parent_id=None).order_by(Category.name).all()
    return jsonify([c.to_dict(include_children=True) for c in roots]), 200


@categories_bp.get("/<slug>")
def get_category(slug: str):
    category = Category.query.filter_by(slug=slug).first()
    if not category:
        raise NotFoundError("Category not found")
    return jsonify(category.to_dict(include_children=True)), 200
