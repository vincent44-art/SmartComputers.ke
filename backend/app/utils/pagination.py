"""Uniform pagination envelope for list endpoints."""
from __future__ import annotations

from typing import Any, Callable

from flask import request


def paginate(query, serializer: Callable[[Any], dict], default_per_page: int = 12) -> dict:
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(request.args.get("perPage", default_per_page, type=int), 60)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": [serializer(item) for item in pagination.items],
        "meta": {
            "page": pagination.page,
            "perPage": per_page,
            "total": pagination.total,
            "totalPages": pagination.pages,
            "hasNext": pagination.has_next,
            "hasPrev": pagination.has_prev,
        },
    }
