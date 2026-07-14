"""Product catalog endpoints with faceted filtering, sort and pagination."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from ..extensions import db
from ..models import Brand, Category, Product
from ..utils.errors import NotFoundError
from ..utils.pagination import paginate

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

_SORT_MAP = {
    "newest": Product.created_at.desc(),
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
    "rating": Product.rating_avg.desc(),
    "popular": Product.rating_count.desc(),
}


@products_bp.get("")
def list_products():
    query = Product.query

    category_slug = request.args.get("category")
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter(Product.category_id == category.id)

    brand_slugs = request.args.getlist("brand")
    if brand_slugs:
        brand_ids = [
            b.id for b in Brand.query.filter(Brand.slug.in_(brand_slugs)).all()
        ]
        if brand_ids:
            query = query.filter(Product.brand_id.in_(brand_ids))

    search = request.args.get("q")
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(like),
                Product.short_description.ilike(like),
                Product.sku.ilike(like),
            )
        )

    min_price = request.args.get("minPrice", type=float)
    max_price = request.args.get("maxPrice", type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    for field, column in (
        ("ram", Product.ram),
        ("storage", Product.storage),
        ("processor", Product.processor),
        ("condition", Product.condition),
    ):
        values = request.args.getlist(field)
        if values:
            query = query.filter(column.in_(values))

    if request.args.get("inStock") == "true":
        query = query.filter(Product.stock > 0)

    for flag, column in (
        ("featured", Product.is_featured),
        ("bestSeller", Product.is_best_seller),
        ("flashSale", Product.is_flash_sale),
    ):
        if request.args.get(flag) == "true":
            query = query.filter(column.is_(True))

    sort = request.args.get("sort", "newest")
    query = query.order_by(_SORT_MAP.get(sort, Product.created_at.desc()))

    return jsonify(paginate(query, lambda p: p.to_dict())), 200


@products_bp.get("/facets")
def facets():
    """Distinct filter values so the storefront can render dynamic filters."""

    def distinct(column):
        rows = db.session.query(column).distinct().all()
        return sorted({r[0] for r in rows if r[0]})

    return (
        jsonify(
            {
                "ram": distinct(Product.ram),
                "storage": distinct(Product.storage),
                "processor": distinct(Product.processor),
                "condition": distinct(Product.condition),
                "brands": [b.to_dict() for b in Brand.query.order_by(Brand.name).all()],
                "priceRange": {
                    "min": float(db.session.query(db.func.min(Product.price)).scalar() or 0),
                    "max": float(db.session.query(db.func.max(Product.price)).scalar() or 0),
                },
            }
        ),
        200,
    )


@products_bp.get("/<slug>")
def get_product(slug: str):
    product = Product.query.filter_by(slug=slug).first()
    if not product:
        raise NotFoundError("Product not found")

    related = (
        Product.query.filter(
            Product.category_id == product.category_id, Product.id != product.id
        )
        .order_by(Product.rating_avg.desc())
        .limit(8)
        .all()
    )
    data = product.to_dict(detail=True)
    data["related"] = [p.to_dict() for p in related]
    data["reviews"] = [
        r.to_dict() for r in product.reviews if r.is_approved
    ]
    return jsonify(data), 200
