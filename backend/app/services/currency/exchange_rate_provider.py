from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Dict, List

import requests

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProviderRates:
    """Rates as returned by the provider.

    Base currency is always KES in our app.
    rates: mapping of target currency code -> 1 KES = rate
    """

    base: str
    rates: Dict[str, float]
    fetched_at: float


class ExchangeRateProvider:
    """Frankfurter API v2 provider.

    Endpoint:
      https://api.frankfurter.dev/v2/rates?base=KES&quotes=USD,TZS,UGX

    No API key required.
    """

    def __init__(self, *, base: str = "KES", timeout_seconds: int = 10):
        self.base = base
        self.timeout_seconds = timeout_seconds

    def fetch_latest(self, quotes: List[str]) -> ProviderRates:
        quotes_sorted = sorted({q.upper().strip() for q in quotes if q})
        to_param = ",".join(quotes_sorted)
        url = (
            "https://api.frankfurter.dev/v2/rates"
            f"?base={self.base}&quotes={to_param}"
        )

        # Required logging details
        logger.info("FX provider request url=%s quotes=%s", url, quotes_sorted)

        resp = requests.get(url, timeout=self.timeout_seconds)
        status = resp.status_code
        body_text = resp.text

        logger.info("FX provider response status=%s", status)
        logger.debug("FX provider response body=%s", body_text)

        resp.raise_for_status()

        try:
            payload = resp.json()
        except Exception as e:
            logger.exception("FX provider failed to parse JSON")
            raise ValueError(
                f"FX provider returned non-JSON response (status={status})"
            ) from e

        logger.debug("FX provider parsed payload type=%s", type(payload).__name__)

        # Parse Frankfurter API v2 response.
        # Documented response (object):
        #   {"base": "KES", "rates": {"USD": 0.0077, ...}, "date": "..."}
        # Some variants/errors may return a list:
        #   [{"base": "KES", "quote": "USD", "rate": 0.0077}, ...]
        base: str = self.base
        rates: Dict[str, float] = {}

        try:
            if isinstance(payload, dict):
                base = str(payload.get("base") or self.base)
                raw_rates = payload.get("rates") or {}

                if not isinstance(raw_rates, dict):
                    raise ValueError(
                        f"FX provider invalid 'rates' type: {type(raw_rates).__name__}"
                    )

                for code in quotes_sorted:
                    val = raw_rates.get(code)
                    if isinstance(val, (int, float)):
                        rates[code] = float(val)

            elif isinstance(payload, list):
                # Build rates from list entries.
                # Accept entries like {base, quote, rate}
                items: list = payload
                if items:
                    first_base = items[0].get("base") if isinstance(items[0], dict) else None
                    if first_base:
                        base = str(first_base)

                for item in items:
                    if not isinstance(item, dict):
                        continue
                    quote = item.get("quote")
                    rate_val = item.get("rate")
                    if not quote:
                        continue
                    code = str(quote).upper().strip()
                    if code in quotes_sorted and isinstance(rate_val, (int, float)):
                        rates[code] = float(rate_val)

            else:
                raise ValueError(
                    f"FX provider returned unexpected payload type: {type(payload).__name__}"
                )

        except Exception as e:
            # Parsing errors: log raw response and payload summary.
            logger.exception(
                "FX provider parsing error (status=%s). raw_body_len=%s",
                status,
                len(body_text) if body_text is not None else 0,
            )
            # Keep raw_response/body_text in logs for debugging.
            logger.debug("FX provider raw response body=%s", body_text)
            logger.debug("FX provider payload=%s", payload)
            raise ValueError(
                f"FX provider response parsing failed (status={status})"
            ) from e

        missing = [c for c in quotes_sorted if c not in rates]
        if missing:
            logger.error(
                "FX provider missing requested rates: missing=%s parsed_keys=%s",
                missing,
                list(rates.keys()),
            )
            logger.debug("FX provider raw response body=%s", body_text)
            raise ValueError(f"FX provider missing rates for: {missing}")

        # Parsed data logging
        logger.info(
            "FX provider parsed base=%s requested_quotes=%s parsed_rate_keys=%s",
            base,
            quotes_sorted,
            list(rates.keys()),
        )
        logger.debug("FX provider parsed rates=%s", json.dumps(rates))

        import time

        return ProviderRates(base=base, rates=rates, fetched_at=time.time())


