"""Auth helpers: current-user resolution and role guards."""
from __future__ import annotations

from functools import wraps
from typing import Callable

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..models import User
from .errors import AuthError


def current_user() -> User | None:
    identity = get_jwt_identity()
    if identity is None:
        return None
    return User.query.get(int(identity))


def admin_required(fn: Callable) -> Callable:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = current_user()
        if user is None or not user.is_admin:
            raise AuthError("Administrator access required")
        return fn(*args, **kwargs)

    return wrapper
