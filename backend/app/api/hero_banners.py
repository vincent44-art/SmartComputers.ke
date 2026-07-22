"""Public Hero Banner endpoints.

Returns active, in-schedule banners for the homepage hero carousel.
"""
from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify

from ..extensions import db
from ..models import HeroBanner

hero_banners_bp = Blueprint("hero_banners", __name__, url_prefix="/api/hero-banners")


@hero_banners_bp.get("")
def list_active_banners():
    """Return active banners that are within their scheduled date range,
    ordered by display_order ascending."""
    now = datetime.utcnow()
    banners = (
        HeroBanner.query
        .filter(HeroBanner.is_active.is_(True))
        .filter(
            db.or_(
                HeroBanner.start_date.is_(None),
                HeroBanner.start_date <= now,
            )
        )
        .filter(
            db.or_(
                HeroBanner.end_date.is_(None),
                HeroBanner.end_date >= now,
            )
        )
        .order_by(HeroBanner.display_order.asc())
        .all()
    )
    return jsonify([b.to_dict() for b in banners]), 200

