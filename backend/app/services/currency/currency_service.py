from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Dict, Optional

from .cache_manager import CacheManager, CachedRates
from .currency_formatter import CurrencyFormatter
from .exchange_rate_provider import ExchangeRateProvider
from .price_converter import PriceConverter

logger = logging.getLogger(__name__)


SUPPORTED_CURRENCIES = ["KES", "USD", "TZS", "UGX"]
BASE_CURRENCY = "KES"


@dataclass(frozen=True)
class FXStatus:
    provider_status: str  # ok|failed_using_cache|no_cache
    last_updated_at: Optional[float]
    cache_expiry_at: Optional[float]


@dataclass(frozen=True)
class ConversionResult:
    amount: float
    currency: str
    fx_status: FXStatus
    fx_available: bool


class CurrencyService:
    """Orchestrates live FX fetching, caching, parsing, and safe conversion.

    Contract additions required by your spec:
    - Conversion never returns None.
    - If no live rates and no cached rates exist, return a controlled error
      (via ConversionResult.fx_available=False / provider_status=no_cache).
    - If provider fails, we continue using last cached rates.
    - Comprehensive logging: request url, status, body, parsed data, cache
      updates, and exceptions with traceback.
    """

    def __init__(self):
        self._provider = ExchangeRateProvider(base=BASE_CURRENCY)
        self._cache = CacheManager(ttl_seconds=3600)
        self._converter = PriceConverter(base=BASE_CURRENCY)
        self._formatter = CurrencyFormatter()

    def _build_fx_status(self, cached: Optional[CachedRates], provider_status: str) -> FXStatus:
        if not cached:
            return FXStatus(
                provider_status=provider_status,
                last_updated_at=None,
                cache_expiry_at=None,
            )
        cache_expiry = cached.fetched_at + 3600
        return FXStatus(
            provider_status=provider_status,
            last_updated_at=cached.fetched_at,
            cache_expiry_at=cache_expiry,
        )

    def refresh_rates(self) -> ConversionResult | FXStatus:
        """Force refresh from provider.

        Returns ConversionResult only to satisfy type expectations; callers
        should prefer get_status() endpoints.
        """
        # Fetch and update cache.
        quotes = [c for c in SUPPORTED_CURRENCIES if c != BASE_CURRENCY]
        cached: Optional[CachedRates] = None
        try:
            provider_rates = self._provider.fetch_latest(quotes=quotes)
            cached = CachedRates(
                base=provider_rates.base,
                rates=provider_rates.rates,
                fetched_at=provider_rates.fetched_at,
                saved_at=time.time(),
            )
            self._cache.save(cached)
            status = self._build_fx_status(cached, "ok")
            return FXStatus(
                provider_status=status.provider_status,
                last_updated_at=status.last_updated_at,
                cache_expiry_at=status.cache_expiry_at,
            )
        except Exception:
            logger.exception("FX refresh failed")
            cached = self._cache.get_any()
            status = self._build_fx_status(
                cached, "failed_using_cache" if cached else "no_cache"
            )
            return status

    def get_status(self) -> FXStatus:
        cached = self._cache.get_any()
        if not cached:
            return FXStatus(
                provider_status="no_cache", last_updated_at=None, cache_expiry_at=None
            )
        # Determine if it is fresh.
        fresh = self._cache.get_fresh() is not None
        return self._build_fx_status(cached, "ok" if fresh else "failed_using_cache")

    def _get_rates_for_conversion(self) -> tuple[Optional[CachedRates], str]:
        # Prefer fresh rates.
        cached_fresh = self._cache.get_fresh()
        if cached_fresh:
            return cached_fresh, "ok"

        # Attempt provider refresh (might fail; if so we use any cache).
        quotes = [c for c in SUPPORTED_CURRENCIES if c != BASE_CURRENCY]
        try:
            provider_rates = self._provider.fetch_latest(quotes=quotes)
            cached = CachedRates(
                base=provider_rates.base,
                rates=provider_rates.rates,
                fetched_at=provider_rates.fetched_at,
                saved_at=time.time(),
            )
            self._cache.save(cached)
            return cached, "ok"
        except Exception:
            logger.exception("FX provider fetch failed; falling back to cache")
            cached_any = self._cache.get_any()
            if cached_any:
                return cached_any, "failed_using_cache"
            return None, "no_cache"

    def convert_amount(self, amount_kes: float, target_currency: str) -> ConversionResult:
        target = (target_currency or "").upper().strip()
        if target not in SUPPORTED_CURRENCIES:
            # Controlled behavior: unsupported currency => return KES amount with fx_available=False.
            status = self.get_status()
            return ConversionResult(
                amount=float(amount_kes),
                currency=BASE_CURRENCY,
                fx_status=status,
                fx_available=False,
            )

        if target == BASE_CURRENCY:
            return ConversionResult(
                amount=float(amount_kes),
                currency=BASE_CURRENCY,
                fx_status=self.get_status(),
                fx_available=True,
            )

        cached, provider_status = self._get_rates_for_conversion()
        fx_status = self._build_fx_status(cached, provider_status)

        if not cached:
            # Controlled error: we return amount in KES and signal fx is unavailable.
            return ConversionResult(
                amount=float(amount_kes),
                currency=BASE_CURRENCY,
                fx_status=fx_status,
                fx_available=False,
            )

        # Convert using cached rates; never return None.
        try:
            converted = self._converter.convert(
                amount_kes=float(amount_kes),
                target_currency=target,
                rates=cached.rates,
            )
            return ConversionResult(
                amount=float(converted),
                currency=target,
                fx_status=fx_status,
                fx_available=True,
            )
        except Exception:
            logger.exception("FX conversion failed (missing rate?)")
            return ConversionResult(
                amount=float(amount_kes),
                currency=BASE_CURRENCY,
                fx_status=fx_status,
                fx_available=False,
            )

