from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from typing import Dict, Optional

import requests

logger = logging.getLogger(__name__)


BASE_CURRENCY = "KES"

SUPPORTED_CURRENCIES = {
    "KES",
    "USD",
    "EUR",
    "GBP",
    "AED",
    "UGX",
    "TZS",
}


@dataclass(frozen=True)
class CurrencyRates:
    # base -> target rate mapping (i.e. 1 KES = rates[target])
    base: str
    rates: Dict[str, float]
    fetched_at: float


class ExchangeRateProvider:
    """Fetch live forex rates from a provider.

    Keep this as a thin wrapper so we can swap providers later.
    """

    def __init__(
        self,
        *,
        base: str = BASE_CURRENCY,
        timeout_seconds: int = 10,
    ):
        self.base = base
        self.timeout_seconds = timeout_seconds

    def fetch_latest(self, symbols: list[str]) -> CurrencyRates:
        # Frankfurter provides rates like:
        # { "base":"KES", "rates": {"USD":..., "TZS":...} }
        # No API key required.
        # Recommended endpoint:
        #   https://api.frankfurter.app/latest?from=KES&to=USD,EUR,...
        to_param = ",".join(sorted(symbols))
        url = f"https://api.frankfurter.app/latest?from={self.base}&to={to_param}"


        resp = requests.get(url, timeout=self.timeout_seconds)
        resp.raise_for_status()
        payload = resp.json()

        raw_rates = payload.get("rates") or {}
        rates: Dict[str, float] = {}
        for code in symbols:
            val = raw_rates.get(code)
            if isinstance(val, (int, float)):
                rates[code] = float(val)

        missing = set(symbols).difference(rates.keys())
        if missing:
            raise ValueError(f"FX provider missing rates for: {sorted(missing)}")

        return CurrencyRates(base=self.base, rates=rates, fetched_at=time.time())


class CurrencyService:
    """Production-ready currency conversion service.

    - Fetches live forex rates
    - Caches them in-memory
    - Persists cache on disk so restarts keep last-known-good rates
    - Converts KES -> target currency dynamically

    Error handling policy:
    - If provider fails: use most recently cached rates
    - If no cache exists: never crash; return None and let caller show a
      friendly message.
    """

    def __init__(
        self,
        *,
        provider: Optional[ExchangeRateProvider] = None,
        cache_ttl_seconds: int = 3600,
        cache_file_path: Optional[str] = None,
    ):
        self._provider = provider or ExchangeRateProvider()
        self._cache_ttl_seconds = cache_ttl_seconds
        self._lock = threading.Lock()

        if cache_file_path:
            self._cache_file_path = cache_file_path
        else:
            # Persist under backend/instance/ so it works in docker.
            backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            self._cache_file_path = os.path.join(backend_root, "instance", "fx_rates_cache.json")

        os.makedirs(os.path.dirname(self._cache_file_path), exist_ok=True)

        self._memory_rates: Optional[CurrencyRates] = None

    def _load_disk_cache(self) -> Optional[CurrencyRates]:
        try:
            if not os.path.exists(self._cache_file_path):
                return None
            with open(self._cache_file_path, "r", encoding="utf-8") as f:
                payload = json.load(f)

            base = payload.get("base")
            fetched_at = float(payload.get("fetched_at"))
            rates = payload.get("rates") or {}
            if base != BASE_CURRENCY or not isinstance(rates, dict):
                return None

            converted: Dict[str, float] = {}
            for k, v in rates.items():
                if isinstance(v, (int, float)):
                    converted[str(k).upper()] = float(v)

            # Ensure we have at least some useful rates
            if not converted:
                return None

            return CurrencyRates(base=base, rates=converted, fetched_at=fetched_at)
        except Exception:
            return None

    def _save_disk_cache(self, rates: CurrencyRates) -> None:
        payload = {
            "base": rates.base,
            "fetched_at": rates.fetched_at,
            "rates": rates.rates,
        }
        tmp_path = f"{self._cache_file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        os.replace(tmp_path, self._cache_file_path)

    def _is_fresh(self, fetched_at: float) -> bool:
        return (time.time() - fetched_at) < self._cache_ttl_seconds

    def get_rates(self) -> Optional[CurrencyRates]:
        """Return cached rates if fresh; otherwise try live fetch.

        If live fetch fails, falls back to most recently cached rates
        (fresh or stale).
        """

        supported_targets = sorted(SUPPORTED_CURRENCIES.difference({BASE_CURRENCY}))

        with self._lock:
            if self._memory_rates is not None and self._is_fresh(self._memory_rates.fetched_at):
                return self._memory_rates

            # Attempt live fetch if we don't have fresh memory rates.
            try:
                latest = self._provider.fetch_latest(supported_targets)
                self._memory_rates = latest
                try:
                    self._save_disk_cache(latest)
                except Exception:
                    # Disk persistence failure should not break pricing.
                    logger.warning("Failed to persist fx rates cache to disk", exc_info=True)
                return latest
            except Exception:
                # Provider unavailable: use disk cache.
                disk_rates = self._load_disk_cache()
                if disk_rates is not None:
                    self._memory_rates = disk_rates
                    logger.warning("FX provider unavailable; using cached rates from disk")
                    return disk_rates

                # Also check whether we have any stale memory rates.
                if self._memory_rates is not None:
                    logger.warning("FX provider unavailable; using stale in-memory rates")
                    return self._memory_rates

                logger.warning("FX provider unavailable and no cached rates exist")
                return None

    def convert_amount(self, amount_kes: float, target_currency: str) -> Optional[float]:
        code = (target_currency or "").upper().strip()
        if not code or code not in SUPPORTED_CURRENCIES:
            # Unknown currency: treat as no conversion.
            return float(amount_kes)

        if code == BASE_CURRENCY:
            return float(amount_kes)

        rates = self.get_rates()
        if rates is None:
            return None

        rate = rates.rates.get(code)
        if not rate:
            # Missing currency from provider payload: don't crash; caller will handle.
            return None

        # Frankfurter representation: 1 KES = rate(target)
        return float(amount_kes) * float(rate)


# Singleton-style service for app-wide use.
_currency_service: Optional[CurrencyService] = None


def get_currency_service() -> CurrencyService:
    global _currency_service
    if _currency_service is None:
        _currency_service = CurrencyService()
    return _currency_service

