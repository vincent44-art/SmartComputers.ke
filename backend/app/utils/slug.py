"""Slug helpers for SEO-friendly URLs."""
from __future__ import annotations

import re

_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = _slug_re.sub("-", value)
    return value.strip("-")
