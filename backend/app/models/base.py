"""Common model mixins."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import func

from ..extensions import db


class TimestampMixin:
    """Adds created/updated timestamps to a model."""

    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        server_default=func.now(),
        onupdate=datetime.utcnow,
        nullable=False,
    )
