from __future__ import annotations

from typing import Optional

from .currency_service import CurrencyService

_currency_service: Optional[CurrencyService] = None


def get_currency_service() -> CurrencyService:
    global _currency_service
    if _currency_service is None:
        _currency_service = CurrencyService()
    return _currency_service

