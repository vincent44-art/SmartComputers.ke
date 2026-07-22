"""Catalog models: categories, brands, products and product images."""
from __future__ import annotations

from sqlalchemy import func

from ..extensions import db
from .base import TimestampMixin


class Category(TimestampMixin, db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(60), nullable=True)  # react-icons key
    image_url = db.Column(db.String(500), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)

    children = db.relationship(
        "Category", backref=db.backref("parent", remote_side=[id])
    )
    products = db.relationship("Product", back_populates="category")

    def to_dict(self, include_children: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "icon": self.icon,
            "imageUrl": self.image_url,
            "parentId": self.parent_id,
            "isFeatured": self.is_featured,
        }
        if include_children:
            data["children"] = [c.to_dict() for c in self.children]
        return data


class Brand(TimestampMixin, db.Model):
    __tablename__ = "brands"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    logo_url = db.Column(db.String(500), nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)

    products = db.relationship("Product", back_populates="brand")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "logoUrl": self.logo_url,
            "isFeatured": self.is_featured,
        }


class Product(TimestampMixin, db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(280), unique=True, nullable=False, index=True)
    sku = db.Column(db.String(60), unique=True, nullable=False, index=True)
    short_description = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)

    price = db.Column(db.Numeric(12, 2), nullable=False)
    compare_at_price = db.Column(db.Numeric(12, 2), nullable=True)
    currency = db.Column(db.String(3), nullable=False, default="KES")

    stock = db.Column(db.Integer, nullable=False, default=0)
    condition = db.Column(db.String(20), nullable=False, default="new")  # new|refurbished

    # Denormalized tech spec fields for fast faceted filtering.
    processor = db.Column(db.String(120), nullable=True)
    ram = db.Column(db.String(40), nullable=True)
    storage = db.Column(db.String(60), nullable=True)
    display = db.Column(db.String(120), nullable=True)
    graphics = db.Column(db.String(120), nullable=True)
    specs = db.Column(db.JSON, nullable=True)  # arbitrary spec table

    warranty = db.Column(db.String(120), nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)
    is_best_seller = db.Column(db.Boolean, nullable=False, default=False)
    is_flash_sale = db.Column(db.Boolean, nullable=False, default=False)
    flash_sale_ends_at = db.Column(db.DateTime, nullable=True)

    rating_avg = db.Column(db.Float, nullable=False, default=0.0)
    rating_count = db.Column(db.Integer, nullable=False, default=0)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey("brands.id"), nullable=True)

    category = db.relationship("Category", back_populates="products")
    brand = db.relationship("Brand", back_populates="products")
    images = db.relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.position",
    )
    reviews = db.relationship(
        "Review", back_populates="product", cascade="all, delete-orphan"
    )

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def discount_percent(self) -> int:
        if self.compare_at_price and self.compare_at_price > self.price:
            return round(
                (float(self.compare_at_price) - float(self.price))
                / float(self.compare_at_price)
                * 100
            )
        return 0

    def recompute_rating(self) -> None:
        from .review import Review

        result = (
            db.session.query(
                func.avg(Review.rating), func.count(Review.id)
            )
            .filter(Review.product_id == self.id, Review.is_approved.is_(True))
            .one()
        )
        self.rating_avg = round(float(result[0] or 0), 2)
        self.rating_count = int(result[1] or 0)

    def to_dict(self, detail: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "sku": self.sku,
            "shortDescription": self.short_description,
            "price": float(self.price),
            "compareAtPrice": float(self.compare_at_price)
            if self.compare_at_price
            else None,
            "currency": self.currency,
            "discountPercent": self.discount_percent,
            "stock": self.stock,
            "inStock": self.in_stock,
            "condition": self.condition,
            "ratingAvg": self.rating_avg,
            "ratingCount": self.rating_count,
            "isFeatured": self.is_featured,
            "isBestSeller": self.is_best_seller,
            "isFlashSale": self.is_flash_sale,
            "flashSaleEndsAt": self.flash_sale_ends_at.isoformat()
            if self.flash_sale_ends_at
            else None,
            "brand": self.brand.to_dict() if self.brand else None,
            "category": self.category.to_dict() if self.category else None,
            "thumbnail": self.images[0].url if self.images else None,
            "specsSummary": {
                "processor": self.processor,
                "ram": self.ram,
                "storage": self.storage,
                "display": self.display,
                "graphics": self.graphics,
            },
        }
        if detail:
            data.update(
                {
                    "description": self.description,
                    "warranty": self.warranty,
                    "specs": self.specs or {},
                    "images": [img.to_dict() for img in self.images],
                }
            )
        return data


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    alt = db.Column(db.String(255), nullable=True)
    position = db.Column(db.Integer, nullable=False, default=0)

    product = db.relationship("Product", back_populates="images")

    def to_dict(self) -> dict:
        return {"id": self.id, "url": self.url, "alt": self.alt, "position": self.position}
