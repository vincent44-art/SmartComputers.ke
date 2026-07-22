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
    HeroBanner,
    Order,
    OrderItem,
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
    # ── Totals ──
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
    pending_order_count = (
        db.session.query(func.count(Order.id))
        .filter(Order.status == "pending")
        .scalar()
    )
    low_stock_count = (
        db.session.query(func.count(Product.id))
        .filter(Product.stock <= 5)
        .scalar()
    )

    # ── Order status counts ──
    status_counts = {}
    for status_val in ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]:
        count = (
            db.session.query(func.count(Order.id))
            .filter(Order.status == status_val)
            .scalar()
        )
        status_counts[status_val] = count

    # ── Revenue series ──
    today = datetime.utcnow().date()

    def build_revenue_series(days: int):
        series = []
        for i in range(days - 1, -1, -1):
            day = today - timedelta(days=i)
            start = datetime.combine(day, datetime.min.time())
            end = start + timedelta(days=1)
            day_total = float(
                db.session.query(func.coalesce(func.sum(Order.total), 0))
                .filter(Order.created_at >= start, Order.created_at < end)
                .scalar()
            )
            series.append({"date": day.isoformat(), "revenue": day_total})
        return series

    def build_orders_series(days: int):
        series = []
        for i in range(days - 1, -1, -1):
            day = today - timedelta(days=i)
            start = datetime.combine(day, datetime.min.time())
            end = start + timedelta(days=1)
            day_count = (
                db.session.query(func.count(Order.id))
                .filter(Order.created_at >= start, Order.created_at < end)
                .scalar()
            )
            series.append({"date": day.isoformat(), "orders": day_count})
        return series

    def build_monthly_revenue_series():
        series = []
        for i in range(11, -1, -1):
            month_start = today.replace(day=1) - timedelta(days=30 * i)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1)
            month_total = float(
                db.session.query(func.coalesce(func.sum(Order.total), 0))
                .filter(Order.created_at >= month_start, Order.created_at < month_end)
                .scalar()
            )
            series.append({
                "date": month_start.strftime("%Y-%m"),
                "revenue": month_total,
            })
        return series

    def build_monthly_orders_series():
        series = []
        for i in range(11, -1, -1):
            month_start = today.replace(day=1) - timedelta(days=30 * i)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1)
            month_count = (
                db.session.query(func.count(Order.id))
                .filter(Order.created_at >= month_start, Order.created_at < month_end)
                .scalar()
            )
            series.append({
                "date": month_start.strftime("%Y-%m"),
                "orders": month_count,
            })
        return series

    revenue_series_7d = build_revenue_series(7)
    revenue_series_30d = build_revenue_series(30)
    revenue_series_12m = build_monthly_revenue_series()
    orders_series_7d = build_orders_series(7)
    orders_series_30d = build_orders_series(30)
    orders_series_12m = build_monthly_orders_series()

    # ── Best selling categories ──
    best_selling_categories = (
        db.session.query(
            Category.name,
            func.count(OrderItem.id).label("order_count"),
            func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0).label("revenue"),
        )
        .join(Product, OrderItem.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.payment_status == "paid")
        .group_by(Category.name)
        .order_by(func.sum(OrderItem.unit_price * OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    # ── Payment method breakdown ──
    payment_method_breakdown = (
        db.session.query(
            Order.payment_method,
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
        )
        .filter(Order.payment_status == "paid", Order.payment_method.isnot(None))
        .group_by(Order.payment_method)
        .order_by(func.count(Order.id).desc())
        .all()
    )

    # ── Recent orders (enriched with customer info) ──
    recent_orders = (
        Order.query
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    def enrich_order(o: Order) -> dict:
        d = o.to_dict()
        if o.user:
            d["customerName"] = o.user.full_name or o.user.email
            d["customerEmail"] = o.user.email
        else:
            d["customerName"] = o.email or "Guest"
            d["customerEmail"] = o.email or ""
        return d

    # ── Recent customers ──
    recent_customers_data = (
        User.query
        .filter(User.role == "customer")
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )

    def enrich_customer(u: User) -> dict:
        order_count = (
            db.session.query(func.count(Order.id))
            .filter(Order.user_id == u.id)
            .scalar()
        )
        total_spent = float(
            db.session.query(func.coalesce(func.sum(Order.total), 0))
            .filter(Order.user_id == u.id, Order.payment_status == "paid")
            .scalar()
        )
        d = u.to_dict()
        d["orderCount"] = order_count
        d["totalSpent"] = total_spent
        return d

    # ── Low stock / out of stock / recently added products ──
    low_stock_products = (
        Product.query
        .filter(Product.stock <= 5, Product.stock > 0)
        .order_by(Product.stock.asc())
        .limit(10)
        .all()
    )
    out_of_stock_products = (
        Product.query
        .filter(Product.stock == 0)
        .order_by(Product.updated_at.desc())
        .limit(10)
        .all()
    )
    recently_added_products = (
        Product.query
        .order_by(Product.created_at.desc())
        .limit(10)
        .all()
    )

    # ── Hero banners (for management preview) ──
    hero_banners = (
        HeroBanner.query
        .order_by(HeroBanner.display_order.asc())
        .all()
    )

    # ── Store performance ──
    total_visitors = customer_count  # approximation
    returning_customers = (
        db.session.query(func.count(func.distinct(Order.user_id)))
        .filter(Order.user_id.isnot(None))
        .scalar()
    )
    avg_order_value = float(
        db.session.query(func.coalesce(func.avg(Order.total), 0))
        .filter(Order.payment_status == "paid")
        .scalar()
    )
    conversion_rate = round(
        (order_count / max(total_visitors, 1)) * 100, 2
    ) if total_visitors > 0 else 0

    # ── Recent activity feed ──
    # Combine recent orders, product updates, coupon creations, customer registrations,
    # and banner publications into a single activity feed.
    activity_feed = []

    # Recent orders
    recent_orders_activity = (
        Order.query
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    for o in recent_orders_activity:
        customer_name = o.user.full_name if o.user else (o.email or "Guest")
        activity_feed.append({
            "type": "order_placed",
            "message": f"New order #{o.order_number} placed by {customer_name}",
            "amount": float(o.total),
            "timestamp": o.created_at.isoformat() if o.created_at else None,
        })

    # Recent product updates
    recent_products = (
        Product.query
        .order_by(Product.updated_at.desc())
        .limit(5)
        .all()
    )
    for p in recent_products:
        activity_feed.append({
            "type": "product_updated",
            "message": f"Product updated: {p.name}",
            "amount": float(p.price),
            "timestamp": p.updated_at.isoformat() if p.updated_at else None,
        })

    # Recent coupon creations
    recent_coupons = (
        Coupon.query
        .order_by(Coupon.created_at.desc())
        .limit(3)
        .all()
    )
    for c in recent_coupons:
        activity_feed.append({
            "type": "coupon_created",
            "message": f"Coupon created: {c.code}",
            "amount": float(c.amount),
            "timestamp": c.created_at.isoformat() if c.created_at else None,
        })

    # Recent customer registrations
    recent_customers_activity = (
        User.query
        .filter(User.role == "customer")
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )
    for u in recent_customers_activity:
        activity_feed.append({
            "type": "customer_registered",
            "message": f"New customer registered: {u.full_name or u.email}",
            "amount": 0,
            "timestamp": u.created_at.isoformat() if u.created_at else None,
        })

    # Recent banner updates
    recent_banners = (
        HeroBanner.query
        .order_by(HeroBanner.updated_at.desc())
        .limit(3)
        .all()
    )
    for b in recent_banners:
        action = "published" if b.is_active else "unpublished"
        activity_feed.append({
            "type": "banner_published",
            "message": f"Banner {action}: {b.title}",
            "amount": 0,
            "timestamp": b.updated_at.isoformat() if b.updated_at else None,
        })

    # Sort activity by timestamp descending and take top 20
    activity_feed.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    activity_feed = activity_feed[:20]

    return (
        jsonify(
            {
                "totals": {
                    "revenue": total_revenue,
                    "orders": order_count,
                    "customers": customer_count,
                    "products": product_count,
                    "pendingOrders": pending_order_count,
                    "lowStock": low_stock_count,
                },
                "orderStatusCounts": status_counts,
                "revenueSeries7d": revenue_series_7d,
                "revenueSeries30d": revenue_series_30d,
                "revenueSeries12m": revenue_series_12m,
                "ordersSeries7d": orders_series_7d,
                "ordersSeries30d": orders_series_30d,
                "ordersSeries12m": orders_series_12m,
                "bestSellingCategories": [
                    {
                        "name": c.name,
                        "orderCount": c.order_count,
                        "revenue": float(c.revenue),
                    }
                    for c in best_selling_categories
                ],
                "paymentMethodBreakdown": [
                    {
                        "method": p.payment_method,
                        "count": p.count,
                        "revenue": float(p.revenue),
                    }
                    for p in payment_method_breakdown
                ],
                "recentOrders": [enrich_order(o) for o in recent_orders],
                "recentCustomers": [enrich_customer(u) for u in recent_customers_data],
                "lowStockProducts": [p.to_dict() for p in low_stock_products],
                "outOfStockProducts": [p.to_dict() for p in out_of_stock_products],
                "recentlyAddedProducts": [p.to_dict() for p in recently_added_products],
                "heroBanners": [b.to_dict() for b in hero_banners],
                "storePerformance": {
                    "conversionRate": conversion_rate,
                    "averageOrderValue": avg_order_value,
                    "totalVisitors": total_visitors,
                    "returningCustomers": returning_customers,
                },
                "activityFeed": activity_feed,
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
@admin_bp.get("/categories")
@admin_required
def admin_list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict() for c in categories]), 200


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


@admin_bp.patch("/categories/<int:category_id>")
@admin_required
def admin_update_category(category_id: int):
    category = Category.query.get(category_id)
    if not category:
        raise NotFoundError("Category not found")
    data = request.get_json(silent=True) or {}
    if "name" in data:
        category.name = data["name"]
        category.slug = slugify(data["name"])
    if "icon" in data:
        category.icon = data["icon"]
    if "description" in data:
        category.description = data["description"]
    if "isFeatured" in data:
        category.is_featured = bool(data["isFeatured"])
    db.session.commit()
    return jsonify(category.to_dict()), 200


@admin_bp.delete("/categories/<int:category_id>")
@admin_required
def admin_delete_category(category_id: int):
    category = Category.query.get(category_id)
    if not category:
        raise NotFoundError("Category not found")
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"}), 200


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
# Hero Banners CRUD
# --------------------------------------------------------------------------- #
@admin_bp.get("/hero-banners")
@admin_required
def admin_list_hero_banners():
    banners = HeroBanner.query.order_by(HeroBanner.display_order.asc()).all()
    return jsonify([b.to_dict() for b in banners]), 200


@admin_bp.post("/hero-banners")
@admin_required
def admin_create_hero_banner():
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        raise ValidationError("Title is required")

    # Determine next display order if not provided
    display_order = data.get("displayOrder")
    if display_order is None:
        max_order = db.session.query(func.max(HeroBanner.display_order)).scalar()
        display_order = (max_order or 0) + 1

    banner = HeroBanner(
        title=data["title"],
        subtitle=data.get("subtitle"),
        badge=data.get("badge"),
        desktop_image=data.get("desktopImage"),
        mobile_image=data.get("mobileImage"),
        primary_text=data.get("primaryText"),
        primary_url=data.get("primaryUrl"),
        secondary_text=data.get("secondaryText"),
        secondary_url=data.get("secondaryUrl"),
        layout=data.get("layout", "left"),
        overlay_opacity=data.get("overlayOpacity", 0.3),
        animation=data.get("animation", "fade"),
        display_order=display_order,
        is_active=data.get("isActive", True),
        start_date=_parse_datetime(data.get("startDate")),
        end_date=_parse_datetime(data.get("endDate")),
    )
    db.session.add(banner)
    db.session.commit()
    return jsonify(banner.to_dict()), 201


@admin_bp.patch("/hero-banners/<int:banner_id>")
@admin_required
def admin_update_hero_banner(banner_id: int):
    banner = HeroBanner.query.get(banner_id)
    if not banner:
        raise NotFoundError("Hero banner not found")
    data = request.get_json(silent=True) or {}

    for field, attr in (
        ("title", "title"),
        ("subtitle", "subtitle"),
        ("badge", "badge"),
        ("desktopImage", "desktop_image"),
        ("mobileImage", "mobile_image"),
        ("primaryText", "primary_text"),
        ("primaryUrl", "primary_url"),
        ("secondaryText", "secondary_text"),
        ("secondaryUrl", "secondary_url"),
        ("layout", "layout"),
        ("animation", "animation"),
        ("displayOrder", "display_order"),
    ):
        if field in data:
            setattr(banner, attr, data[field])

    if "overlayOpacity" in data:
        banner.overlay_opacity = data["overlayOpacity"]
    if "isActive" in data:
        banner.is_active = bool(data["isActive"])
    if "startDate" in data:
        banner.start_date = _parse_datetime(data["startDate"])
    if "endDate" in data:
        banner.end_date = _parse_datetime(data["endDate"])

    db.session.commit()
    return jsonify(banner.to_dict()), 200


@admin_bp.delete("/hero-banners/<int:banner_id>")
@admin_required
def admin_delete_hero_banner(banner_id: int):
    banner = HeroBanner.query.get(banner_id)
    if not banner:
        raise NotFoundError("Hero banner not found")
    db.session.delete(banner)
    db.session.commit()
    return jsonify({"message": "Hero banner deleted"}), 200


@admin_bp.post("/hero-banners/<int:banner_id>/duplicate")
@admin_required
def admin_duplicate_hero_banner(banner_id: int):
    original = HeroBanner.query.get(banner_id)
    if not original:
        raise NotFoundError("Hero banner not found")

    max_order = db.session.query(func.max(HeroBanner.display_order)).scalar()
    banner = HeroBanner(
        title=f"{original.title} (Copy)",
        subtitle=original.subtitle,
        badge=original.badge,
        desktop_image=original.desktop_image,
        mobile_image=original.mobile_image,
        primary_text=original.primary_text,
        primary_url=original.primary_url,
        secondary_text=original.secondary_text,
        secondary_url=original.secondary_url,
        layout=original.layout,
        overlay_opacity=original.overlay_opacity,
        animation=original.animation,
        display_order=(max_order or 0) + 1,
        is_active=False,
        start_date=original.start_date,
        end_date=original.end_date,
    )
    db.session.add(banner)
    db.session.commit()
    return jsonify(banner.to_dict()), 201


@admin_bp.patch("/hero-banners/reorder")
@admin_required
def admin_reorder_hero_banners():
    data = request.get_json(silent=True) or {}
    order_list = data.get("order")
    if not isinstance(order_list, list):
        raise ValidationError("Order must be a list of { id, displayOrder } objects")

    for item in order_list:
        banner_id = item.get("id")
        new_order = item.get("displayOrder")
        if banner_id is None or new_order is None:
            continue
        banner = HeroBanner.query.get(banner_id)
        if banner:
            banner.display_order = new_order

    db.session.commit()
    return jsonify({"message": "Reordered successfully"}), 200


def _parse_datetime(iso_str: str | None) -> datetime | None:
    if not iso_str:
        return None
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


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
