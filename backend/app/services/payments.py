"""Payment gateway abstractions.

Each provider implements a small, uniform interface so the checkout flow is
gateway-agnostic. Live credentials are read from config; when absent the
providers run in a safe "simulation" mode that returns deterministic fake
references — useful for local dev and CI without real keys.

Production wiring notes:
- M-Pesa: implement Daraja STK Push (OAuth token -> STK push -> callback).
- Stripe: create PaymentIntent, confirm client-side, verify via webhook.
- PayPal: create order, capture on approval, verify via webhook.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass

from flask import current_app


@dataclass
class PaymentResult:
    provider: str
    reference: str
    status: str  # initiated|paid|failed
    simulated: bool
    detail: str = ""

    def to_dict(self) -> dict:
        return {
            "provider": self.provider,
            "reference": self.reference,
            "status": self.status,
            "simulated": self.simulated,
            "detail": self.detail,
        }


def _fake_ref(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12].upper()}"


def initiate_mpesa(amount: float, phone: str, order_number: str) -> PaymentResult:
    configured = bool(current_app.config.get("MPESA_CONSUMER_KEY"))
    if not configured:
        return PaymentResult(
            provider="mpesa",
            reference=_fake_ref("MPESA"),
            status="initiated",
            simulated=True,
            detail="Simulated STK push (no Daraja credentials configured).",
        )
    # TODO: real Daraja STK push using consumer key/secret, shortcode, passkey.
    raise NotImplementedError("Live M-Pesa integration pending credentials wiring")


def initiate_stripe(amount: float, currency: str, order_number: str) -> PaymentResult:
    secret = current_app.config.get("STRIPE_SECRET_KEY")
    if not secret:
        return PaymentResult(
            provider="stripe",
            reference=_fake_ref("PI"),
            status="initiated",
            simulated=True,
            detail="Simulated PaymentIntent (no Stripe key configured).",
        )
    import stripe  # local import so the dep is optional at runtime

    stripe.api_key = secret
    intent = stripe.PaymentIntent.create(
        amount=int(amount * 100),
        currency=currency.lower(),
        metadata={"order_number": order_number},
        automatic_payment_methods={"enabled": True},
    )
    return PaymentResult(
        provider="stripe",
        reference=intent.id,
        status="initiated",
        simulated=False,
        detail=intent.client_secret,
    )


def initiate_paypal(amount: float, currency: str, order_number: str) -> PaymentResult:
    configured = bool(current_app.config.get("PAYPAL_CLIENT_ID"))
    if not configured:
        return PaymentResult(
            provider="paypal",
            reference=_fake_ref("PAYPAL"),
            status="initiated",
            simulated=True,
            detail="Simulated PayPal order (no PayPal credentials configured).",
        )
    # TODO: real PayPal Orders v2 create + capture.
    raise NotImplementedError("Live PayPal integration pending credentials wiring")
