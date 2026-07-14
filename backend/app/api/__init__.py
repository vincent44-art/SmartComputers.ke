"""API blueprint registration."""
from __future__ import annotations

from flask import Flask


def register_api(app: Flask) -> None:
    from .admin import admin_bp
    from .auth import auth_bp
    from .blog import blog_bp, newsletter_bp
    from .brands import brands_bp
    from .cart import cart_bp
    from .categories import categories_bp
    from .coupons import coupons_bp
    from .orders import orders_bp
    from .payments import payments_bp
    from .products import products_bp
    from .reviews import reviews_bp
    from .wishlist import wishlist_bp

    for bp in (
        auth_bp,
        products_bp,
        categories_bp,
        brands_bp,
        cart_bp,
        orders_bp,
        payments_bp,
        reviews_bp,
        coupons_bp,
        wishlist_bp,
        blog_bp,
        newsletter_bp,
        admin_bp,
    ):
        app.register_blueprint(bp)
