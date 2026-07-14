"""Brand endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify

from ..models import Brand

brands_bp = Blueprint("brands", __name__, url_prefix="/api/brands")


@brands_bp.get("")
def list_brands():
    brands = Brand.query.order_by(Brand.name).all()
    return jsonify([b.to_dict() for b in brands]), 200
