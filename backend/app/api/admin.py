"""Admin dashboard endpoints (role-protected).

All routes require an authenticated user with the ``admin`` role via the
``admin_required`` guard.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
import os
import uuid
from flask import send_from_directory
from sqlalchemy import func

from ..extensions import db
from ..models import (
    Brand,
    Category,
    Coupon,
    Order,
    Product,
    ProductImage,
    User,
)
from ..utils.auth import admin_required
from ..utils.errors import NotFoundError, ValidationError
from ..utils.pagination import paginate
from ..utils.slug import slugify

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.post("/uploads/image")
@admin_required

def upload_image():
    """Upload a product image and return a public URL.

    Expects multipart/form-data with field name `file`.
    """

    if "file" not in request.files:
        raise ValidationError("Missing file")

    file = request.files.get("file")
    if not file or not file.filename:
        raise ValidationError("Invalid file")

    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise ValidationError("Unsupported image type")

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "instance", "uploads", "images")
    upload_dir = os.path.abspath(upload_dir)
    os.makedirs(upload_dir, exist_ok=True)

    new_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(upload_dir, new_name)
    file.save(save_path)

    # Serve uploaded files directly from the backend (so nginx/Next don't need any static config).
    # We expose it under /api/admin/uploads/images/<filename>.
    return jsonify({"url": f"/api/admin/uploads/images/{new_name}"}), 201


@admin_bp.get("/uploads/images/<path:filename>")
def serve_uploaded_image(filename: str):

    upload_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "instance", "uploads", "images")
    )
    return send_from_directory(upload_dir, filename)








@admin_bp.get("/analytics")
@admin_required
def analytics():
    total_revenue = float(
        db.session.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.payment_status == "paid")
        .scalar()
    )
    order_count = db.session.query(func.count(Order.id)).scalar()
    customer_count = (
        db.session.query(func.count(User.id)).filter(User.role == "customer").scalar()
    )
    product_count = db.session.query(func.count(Product.id)).scalar()
    low_stock = (
        Product.query.filter(Product.stock <= 5)
        .order_by(Product.stock.asc())
        .limit(5)
        .all()
    )

    # Revenue for the last 7 days.
    today = datetime.utcnow().date()
    revenue_series = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start = datetime.combine(day, datetime.min.time())
        end = start + timedelta(days=1)
        day_total = float(
            db.session.query(func.coalesce(func.sum(Order.total), 0))
            .filter(Order.created_at >= start, Order.created_at < end)
            .scalar()
        )
        revenue_series.append({"date": day.isoformat(), "revenue": day_total})

    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return (
        jsonify(
            {
                "totals": {
                    "revenue": total_revenue,
                    "orders": order_count,
                    "customers": customer_count,
                    "products": product_count,
                },
                "revenueSeries": revenue_series,
                "lowStock": [p.to_dict() for p in low_stock],
                "recentOrders": [o.to_dict() for o in recent_orders],
            }
        ),
        200,
    )


# --------------------------------------------------------------------------- #
# Products CRUD
# --------------------------------------------------------------------------- #
@admin_bp.get("/products")
@admin_required
def admin_list_products():
    query = Product.query.order_by(Product.created_at.desc())
    search = request.args.get("q")
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return jsonify(paginate(query, lambda p: p.to_dict(), default_per_page=20)), 200


def _apply_product_payload(product: Product, data: dict) -> None:
    # Important: do NOT blindly overwrite slug from `name`.
    # - On create, admin_create_product() already generates a unique slug.
    # - Overwriting here would reintroduce UNIQUE constraint failures.
    if "name" in data:
        product.name = data["name"]

    for field in (
        "shortDescription",
        "description",
        "processor",
        "ram",
        "storage",
        "display",
        "graphics",
        "warranty",
        "condition",
    ):
        snake = "".join(
            "_" + c.lower() if c.isupper() else c for c in field
        )
        if field in data:
            setattr(product, snake, data[field])
    for num_field, attr in (
        ("price", "price"),
        ("compareAtPrice", "compare_at_price"),
        ("stock", "stock"),
    ):
        if num_field in data and data[num_field] is not None:
            setattr(product, attr, data[num_field])
    for flag, attr in (
        ("isFeatured", "is_featured"),
        ("isBestSeller", "is_best_seller"),
        ("isFlashSale", "is_flash_sale"),
    ):
        if flag in data:
            setattr(product, attr, bool(data[flag]))
    if "categoryId" in data:
        product.category_id = data["categoryId"]
    if "brandId" in data:
        product.brand_id = data["brandId"]
    if "specs" in data:
        product.specs = data["specs"]


@admin_bp.post("/products")
@admin_required
def admin_create_product():
    data = request.get_json(silent=True) or {}
    if not data.get("name") or data.get("price") is None:
        raise ValidationError("Name and price are required")
    if not data.get("categoryId"):
        raise ValidationError("A category is required")

    # Server-side safety: frontend allows empty image slots (""), but ProductImage.url is NOT NULL.
    raw_images = data.get("images", [])
    if not isinstance(raw_images, list):
        raise ValidationError("Images must be a list")

    images = [str(u).strip() for u in raw_images if u is not None and str(u).strip()]
    if not images:
        raise ValidationError("At least 1 image is required")

    count = db.session.query(func.count(Product.id)).scalar()
    base_slug = slugify(data["name"])

    # Ensure slug uniqueness (the DB has a UNIQUE constraint on products.slug).
    # If the slug already exists, append a numeric suffix.
    slug = base_slug
    suffix = 1
    while Product.query.filter_by(slug=slug).first() is not None:
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    # If slug is still colliding (e.g. race condition), retry with a suffix.
    # SKU can come from the client or be auto-generated.
    # The DB enforces UNIQUE constraint on products.sku, so we must also
    # handle collisions (similar to slug) to avoid 500s.
    sku = (data.get("sku") or "").strip() or None
    if not sku:
        sku = f"SC-{2000 + count}"

    max_attempts = 5
    attempt = 0

    base_sku = sku
    sku_suffix = 0

    # Create the product and retry if either slug or sku collides.
    # (We retry on DB uniqueness failure because there can be races.)
    while True:
        try:
            effective_sku = base_sku if sku_suffix == 0 else f"{base_sku}-{sku_suffix}"
            product = Product(
                name=data["name"],
                slug=slug,
                sku=effective_sku,
                price=data["price"],
                category_id=data["categoryId"],
            )
            db.session.add(product)
            db.session.flush()  # force INSERT so we can catch IntegrityError
            break
        except Exception as e:
            msg = str(e).lower()

            # slug collision
            if "unique constraint failed" in msg and "products.slug" in msg:
                attempt += 1
                if attempt >= max_attempts:
                    raise
                suffix += 1
                slug = f"{base_slug}-{suffix}"
                continue

            # sku collision
            if "unique constraint failed" in msg and "products.sku" in msg:
                attempt += 1
                if attempt >= max_attempts:
                    raise ValidationError("Could not generate a unique SKU for this product")
                sku_suffix += 1
                continue

            raise


    _apply_product_payload(product, data)

    for i, url in enumerate(images):
        product.images.append(ProductImage(url=url, alt=data["name"], position=i))
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict(detail=True)), 201



@admin_bp.patch("/products/<int:product_id>")
@admin_required
def admin_update_product(product_id: int):
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError("Product not found")
    data = request.get_json(silent=True) or {}
    _apply_product_payload(product, data)
    if "images" in data:
        raw_images = data.get("images", [])
        if not isinstance(raw_images, list):
            raise ValidationError("Images must be a list")

        images = [str(u).strip() for u in raw_images if u is not None and str(u).strip()]
        if not images:
            raise ValidationError("At least 1 image is required")

        product.images.clear()
        for i, url in enumerate(images):
            product.images.append(
                ProductImage(url=url, alt=product.name, position=i)
            )
    db.session.commit()
    return jsonify(product.to_dict(detail=True)), 200



@admin_bp.delete("/products/<int:product_id>")
@admin_required
def admin_delete_product(product_id: int):
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError("Product not found")
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200


# --------------------------------------------------------------------------- #
# Categories & brands
# --------------------------------------------------------------------------- #
@admin_bp.post("/categories")
@admin_required
def admin_create_category():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        raise ValidationError("Name is required")
    category = Category(
        name=data["name"],
        slug=slugify(data["name"]),
        icon=data.get("icon"),
        description=data.get("description"),
        is_featured=bool(data.get("isFeatured")),
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@admin_bp.post("/brands")
@admin_required
def admin_create_brand():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        raise ValidationError("Name is required")
    brand = Brand(
        name=data["name"],
        slug=slugify(data["name"]),
        logo_url=data.get("logoUrl"),
        is_featured=bool(data.get("isFeatured")),
    )
    db.session.add(brand)
    db.session.commit()
    return jsonify(brand.to_dict()), 201


# --------------------------------------------------------------------------- #
# Orders
# --------------------------------------------------------------------------- #
@admin_bp.get("/orders")
@admin_required
def admin_list_orders():
    query = Order.query.order_by(Order.created_at.desc())
    status = request.args.get("status")
    if status:
        query = query.filter(Order.status == status)
    return jsonify(paginate(query, lambda o: o.to_dict(), default_per_page=20)), 200


@admin_bp.patch("/orders/<int:order_id>")
@admin_required
def admin_update_order(order_id: int):
    order = Order.query.get(order_id)
    if not order:
        raise NotFoundError("Order not found")
    data = request.get_json(silent=True) or {}
    if "status" in data:
        order.status = data["status"]
    if "paymentStatus" in data:
        order.payment_status = data["paymentStatus"]
    db.session.commit()
    return jsonify(order.to_dict(detail=True)), 200


# --------------------------------------------------------------------------- #
# Customers
# --------------------------------------------------------------------------- #
@admin_bp.get("/customers")
@admin_required
def admin_list_customers():
    query = User.query.filter_by(role="customer").order_by(User.created_at.desc())
    return jsonify(paginate(query, lambda u: u.to_dict(), default_per_page=20)), 200


# --------------------------------------------------------------------------- #
# Coupons CRUD
# --------------------------------------------------------------------------- #
@admin_bp.get("/coupons")
@admin_required
def admin_list_coupons():
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return jsonify([c.to_dict() for c in coupons]), 200


@admin_bp.post("/coupons")
@admin_required
def admin_create_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    if not code or data.get("amount") is None:
        raise ValidationError("Code and amount are required")
    if Coupon.query.filter_by(code=code).first():
        raise ValidationError("Coupon code already exists")
    coupon = Coupon(
        code=code,
        description=data.get("description"),
        discount_type=data.get("discountType", "percent"),
        amount=data["amount"],
        min_subtotal=data.get("minSubtotal", 0),
        usage_limit=data.get("usageLimit"),
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify(coupon.to_dict()), 201


@admin_bp.delete("/coupons/<int:coupon_id>")
@admin_required
def admin_delete_coupon(coupon_id: int):
    coupon = Coupon.query.get(coupon_id)
    if not coupon:
        raise NotFoundError("Coupon not found")
    db.session.delete(coupon)
    db.session.commit()
    return jsonify({"message": "Coupon deleted"}), 200
