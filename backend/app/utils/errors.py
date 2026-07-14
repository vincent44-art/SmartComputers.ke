"""Typed API error used for consistent JSON error responses."""
from __future__ import annotations

from typing import Any


class ApiError(Exception):
    """Raised anywhere in the request lifecycle to short-circuit with JSON."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error: str = "bad_request",
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"error": self.error, "message": self.message}
        if self.details is not None:
            payload["details"] = self.details
        return payload


class NotFoundError(ApiError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404, error="not_found")


class AuthError(ApiError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message, status_code=401, error="unauthorized")


class ValidationError(ApiError):
    def __init__(self, message: str = "Validation failed", details: Any = None) -> None:
        super().__init__(message, status_code=422, error="validation_error", details=details)
