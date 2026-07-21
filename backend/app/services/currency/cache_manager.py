from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from typing import Dict, Optional

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CachedRates:
    base: str
    rates: Dict[str, float]
    fetched_at: float
    saved_at: float


class CacheManager:
    """TTL cache for exchange rates.

    - In-memory caching
    - Optional persistence to disk so container restarts keep last-known-good
      rates.
    """

    def __init__(
        self,
        *,
        ttl_seconds: int = 3600,
        cache_file_path: Optional[str] = None,
    ):
        self._ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._memory: Optional[CachedRates] = None

        if cache_file_path:
            self._cache_file_path = cache_file_path
        else:
            backend_root = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "..")
            )
            self._cache_file_path = os.path.join(
                backend_root, "instance", "fx_rates_cache.json"
            )

        os.makedirs(os.path.dirname(self._cache_file_path), exist_ok=True)

    def _is_fresh(self, fetched_at: float) -> bool:
        return (time.time() - fetched_at) < self._ttl_seconds

    def get_fresh(self) -> Optional[CachedRates]:
        with self._lock:
            if self._memory and self._is_fresh(self._memory.fetched_at):
                return self._memory

            # Load disk cache (if present)
            disk = self.load_from_disk()
            if disk and self._is_fresh(disk.fetched_at):
                self._memory = disk
                return disk

            return None

    def get_any(self) -> Optional[CachedRates]:
        with self._lock:
            if self._memory:
                return self._memory
            disk = self.load_from_disk()
            if disk:
                self._memory = disk
            return disk

    def load_from_disk(self) -> Optional[CachedRates]:
        try:
            if not os.path.exists(self._cache_file_path):
                return None
            with open(self._cache_file_path, "r", encoding="utf-8") as f:
                payload = json.load(f)

            base = payload.get("base")
            rates = payload.get("rates") or {}
            fetched_at = float(payload.get("fetched_at"))
            saved_at = float(payload.get("saved_at", fetched_at))

            if not base or not isinstance(rates, dict) or not rates:
                return None

            parsed_rates: Dict[str, float] = {}
            for k, v in rates.items():
                if isinstance(v, (int, float)):
                    parsed_rates[str(k).upper()] = float(v)

            if not parsed_rates:
                return None

            return CachedRates(
                base=str(base).upper(),
                rates=parsed_rates,
                fetched_at=fetched_at,
                saved_at=saved_at,
            )
        except Exception:
            logger.warning("Failed to load fx cache from disk", exc_info=True)
            return None

    def save(self, cached_rates: CachedRates) -> None:
        with self._lock:
            self._memory = cached_rates

            payload = {
                "base": cached_rates.base,
                "fetched_at": cached_rates.fetched_at,
                "saved_at": cached_rates.saved_at,
                "rates": cached_rates.rates,
            }
            tmp_path = f"{self._cache_file_path}.tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f)
            os.replace(tmp_path, self._cache_file_path)

            cache_expiry = cached_rates.fetched_at + self._ttl_seconds
            logger.info(
                "FX cache updated base=%s keys=%s expires_at=%s",
                cached_rates.base,
                list(cached_rates.rates.keys()),
                time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(cache_expiry)),
            )

