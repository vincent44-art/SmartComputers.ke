"""Backward-compatible FX helper utilities.

The platform stores prices in a single base currency (KES) and converts
lazily at response time using live forex exchange rates.

This module preserves the existing function name `convert_amount` used across
API endpoints, but delegates the implementation to the production
`CurrencyService`.

Error handling policy:
- Never crash pricing flows.
- Never return fake 1:1 conversion rates.
- If exchange-rate data is unavailable, conversion returns None and callers
  can decide how to respond.
"""

from __future__ import annotations

from typing import Optional

from ..services.currency.currency_service import BASE_CURRENCY
from ..services.currency.service_singleton import get_currency_service


def convert_amount(amount: float, currency: str) -> Optional[float]:
    """Convert a KES amount to the given target currency.

    Spec behavior:
    - Never crash.
    - Never return None for conversion in the currency service.

    This wrapper preserves the existing signature used across endpoints.
    When FX is unavailable, we return the KES amount (caller should still
    include `currency` and optionally surface fx_available flags).
    """

    if amount is None:
        return None

    target = (currency or "").upper().strip() or BASE_CURRENCY
    service = get_currency_service()

    result = service.convert_amount(float(amount), target)

    # Keep legacy behavior: return converted amount when available,
    # otherwise return KES amount.
    return float(result.amount)



