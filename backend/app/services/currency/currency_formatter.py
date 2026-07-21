from __future__ import annotations


class CurrencyFormatter:
    """Currency symbol mapping required by the spec."""

    SYMBOLS = {
        "KES": "KSh",
        "USD": "$",
        "TZS": "TSh",
        "UGX": "USh",
    }

    def symbol(self, currency: str) -> str:
        code = (currency or "").upper().strip()
        return self.SYMBOLS.get(code, code)

