from __future__ import annotations

from typing import Dict


class PriceConverter:
    """Pure conversion logic.

    Assumes all product prices are stored in DB in base currency KES.

    Conversion rule:
      provider rates: 1 KES = rate(target)
      amount_target = amount_kes * rate(target)

    Contract:
    - never returns None
    """

    def __init__(self, *, base: str = "KES"):
        self.base = base

    def convert(self, *, amount_kes: float, target_currency: str, rates: Dict[str, float]) -> float:
        target = (target_currency or "").upper().strip()
        amount = float(amount_kes)

        if target == self.base:
            return amount

        rate = rates.get(target)
        if rate is None:
            # Caller must decide how to respond; never return None.
            # We raise a controlled error so the service can fall back.
            raise KeyError(f"Missing rate for {target}")

        return amount * float(rate)

