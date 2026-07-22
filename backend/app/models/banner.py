"""Hero Banner model for homepage hero management."""
from __future__ import annotations

from datetime import datetime

from ..extensions import db
from .base import TimestampMixin


class HeroBanner(TimestampMixin, db.Model):
    __tablename__ = "hero_banners"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(500), nullable=True)
    badge = db.Column(db.String(120), nullable=True)

    desktop_image = db.Column(db.String(500), nullable=True)
    mobile_image = db.Column(db.String(500), nullable=True)

    primary_text = db.Column(db.String(120), nullable=True)
    primary_url = db.Column(db.String(500), nullable=True)
    secondary_text = db.Column(db.String(120), nullable=True)
    secondary_url = db.Column(db.String(500), nullable=True)

    layout = db.Column(db.String(20), nullable=False, default="left")  # left|center|right
    overlay_opacity = db.Column(db.Float, nullable=False, default=0.3)

    animation = db.Column(db.String(20), nullable=False, default="fade")  # fade|slideLeft|slideRight|slideUp|zoom|none

    display_order = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)

    def is_scheduled_and_active(self) -> bool:
        """Return True if the banner should currently be shown."""
        if not self.is_active:
            return False
        now = datetime.utcnow()
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "badge": self.badge,
            "desktopImage": self.desktop_image,
            "mobileImage": self.mobile_image,
            "primaryText": self.primary_text,
            "primaryUrl": self.primary_url,
            "secondaryText": self.secondary_text,
            "secondaryUrl": self.secondary_url,
            "layout": self.layout,
            "overlayOpacity": self.overlay_opacity,
            "animation": self.animation,
            "displayOrder": self.display_order,
            "isActive": self.is_active,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "endDate": self.end_date.isoformat() if self.end_date else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

