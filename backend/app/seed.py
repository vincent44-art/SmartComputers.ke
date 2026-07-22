"""Database seed command with realistic tech-retail catalog data.

Run with ``flask --app wsgi seed`` (or ``python -m flask seed``). Idempotent:
it clears and repopulates the catalog so it is safe to re-run in dev.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import click
from flask import Flask

from .extensions import db
from .models import (
    BlogCategory,
    BlogPost,
    BlogTag,
    Brand,
    Category,
    Coupon,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    User,
)
from .utils.slug import slugify

CATEGORIES = [
    ("Laptops", "laptop", True),
    ("Gaming", "gamepad", True),
    ("Apple", "apple", True),
    ("Monitors", "monitor", True),
    ("Printers", "printer", False),
    ("Accessories", "keyboard", True),
    ("Networking", "wifi", False),
    ("Business Laptops", "briefcase", False),
    ("Student Laptops", "book", False),
]

BRANDS = [
    ("Apple", True),
    ("Dell", True),
    ("HP", True),
    ("Lenovo", True),
    ("Asus", True),
    ("Acer", False),
    ("MSI", True),
    ("Samsung", False),
    ("Logitech", False),
    ("Canon", False),
]

# A curated, original product set (no copied descriptions/assets).
PRODUCTS = [
    {
        "name": "Dell XPS 15 Ultrabook",
        "category": "Business Laptops",
        "brand": "Dell",
        "price": 245000,
        "compare": 289000,
        "processor": "Intel Core i7-13700H",
        "ram": "16GB",
        "storage": "512GB SSD",
        "display": '15.6" 3.5K OLED',
        "graphics": "NVIDIA RTX 4050",
        "featured": True,
        "best": True,
        "desc": "A precision-crafted creator laptop with a stunning 3.5K OLED panel, "
        "CNC-machined aluminium chassis and all-day battery life.",
    },
    {
        "name": "MacBook Pro 14 M3 Pro",
        "category": "Apple",
        "brand": "Apple",
        "price": 329000,
        "compare": 355000,
        "processor": "Apple M3 Pro",
        "ram": "18GB",
        "storage": "1TB SSD",
        "display": '14.2" Liquid Retina XDR',
        "graphics": "18-core GPU",
        "featured": True,
        "best": True,
        "desc": "Pro performance in a portable frame. The M3 Pro chip delivers "
        "exceptional speed for developers, editors and designers.",
    },
    {
        "name": "ASUS ROG Strix G16 Gaming Laptop",
        "category": "Gaming",
        "brand": "Asus",
        "price": 275000,
        "compare": 310000,
        "processor": "Intel Core i9-14900HX",
        "ram": "32GB",
        "storage": "1TB SSD",
        "display": '16" QHD 240Hz',
        "graphics": "NVIDIA RTX 4070",
        "featured": True,
        "flash": True,
        "desc": "Dominate every match with a 240Hz QHD display, RTX 4070 graphics and "
        "an intelligent cooling system engineered for marathon sessions.",
    },
    {
        "name": "HP EliteBook 840 G10",
        "category": "Business Laptops",
        "brand": "HP",
        "price": 165000,
        "compare": 189000,
        "processor": "Intel Core i5-1345U",
        "ram": "16GB",
        "storage": "512GB SSD",
        "display": '14" WUXGA IPS',
        "graphics": "Intel Iris Xe",
        "best": True,
        "desc": "Enterprise-grade security, a featherweight magnesium body and "
        "business-class reliability for the modern professional.",
    },
    {
        "name": "Lenovo IdeaPad Slim 3 Student Laptop",
        "category": "Student Laptops",
        "brand": "Lenovo",
        "price": 68000,
        "compare": 79000,
        "processor": "AMD Ryzen 5 7530U",
        "ram": "8GB",
        "storage": "256GB SSD",
        "display": '15.6" FHD',
        "graphics": "AMD Radeon",
        "flash": True,
        "desc": "Affordable, dependable and light — the perfect companion for lectures, "
        "research and everyday productivity.",
    },
    {
        "name": "MacBook Air 13 M2",
        "category": "Apple",
        "brand": "Apple",
        "price": 179000,
        "compare": 199000,
        "processor": "Apple M2",
        "ram": "8GB",
        "storage": "256GB SSD",
        "display": '13.6" Liquid Retina',
        "graphics": "8-core GPU",
        "featured": True,
        "desc": "Impossibly thin, silent and fast. All-day battery and a gorgeous "
        "Liquid Retina display in a fanless design.",
    },
    {
        "name": "Samsung Odyssey G7 27\" Curved Monitor",
        "category": "Monitors",
        "brand": "Samsung",
        "price": 62000,
        "compare": 72000,
        "processor": None,
        "ram": None,
        "storage": None,
        "display": '27" QHD 240Hz Curved',
        "graphics": None,
        "best": True,
        "desc": "A 1000R curved QHD panel with 240Hz refresh and 1ms response for "
        "utterly immersive gaming and creative work.",
    },
    {
        "name": "Logitech MX Master 3S Wireless Mouse",
        "category": "Accessories",
        "brand": "Logitech",
        "price": 13500,
        "compare": 15900,
        "processor": None,
        "ram": None,
        "storage": None,
        "display": None,
        "graphics": None,
        "flash": True,
        "desc": "The iconic productivity mouse with an 8K DPI sensor, quiet clicks and "
        "MagSpeed electromagnetic scrolling.",
    },
    {
        "name": "Canon PIXMA G3420 All-in-One Printer",
        "category": "Printers",
        "brand": "Canon",
        "price": 28500,
        "compare": 32000,
        "processor": None,
        "ram": None,
        "storage": None,
        "display": None,
        "graphics": None,
        "desc": "High-yield refillable ink tanks, wireless printing and crisp document "
        "quality for the home office.",
    },
    {
        "name": "MSI Katana 15 Gaming Laptop",
        "category": "Gaming",
        "brand": "MSI",
        "price": 189000,
        "compare": 215000,
        "processor": "Intel Core i7-13620H",
        "ram": "16GB",
        "storage": "1TB SSD",
        "display": '15.6" FHD 144Hz',
        "graphics": "NVIDIA RTX 4060",
        "best": True,
        "desc": "Sharp lines, serious power. RTX 4060 graphics and a 144Hz display keep "
        "you ahead of the competition.",
    },
    {
        "name": "Acer Aspire 5 Everyday Laptop",
        "category": "Laptops",
        "brand": "Acer",
        "price": 74000,
        "compare": 85000,
        "processor": "Intel Core i5-1235U",
        "ram": "8GB",
        "storage": "512GB SSD",
        "display": '15.6" FHD IPS',
        "graphics": "Intel Iris Xe",
        "desc": "A balanced all-rounder with a bright IPS display and fast SSD storage "
        "for work, study and streaming.",
    },
    {
        "name": "Apple iPad Air 11 M2",
        "category": "Apple",
        "brand": "Apple",
        "price": 105000,
        "compare": 118000,
        "processor": "Apple M2",
        "ram": "8GB",
        "storage": "128GB",
        "display": '11" Liquid Retina',
        "graphics": "10-core GPU",
        "featured": True,
        "desc": "Serious performance in a slim tablet. Perfect for note-taking, design "
        "and entertainment with Apple Pencil Pro support.",
    },
]

BLOG_CATEGORIES = ["Buying Guides", "Reviews", "Tech Tips", "News"]

BLOG_TAGS = ["laptops", "gaming", "apple", "productivity", "deals"]

BLOG_POSTS = [
    {
        "title": "How to Choose the Perfect Laptop in 2025",
        "category": "Buying Guides",
        "tags": ["laptops", "productivity"],
        "excerpt": "From processors to portability, here's everything you need to "
        "know before buying your next laptop.",
        "body": "Choosing a laptop comes down to matching the hardware to how you "
        "actually work. Start with the processor — an Intel Core i5/Ryzen 5 is the "
        "sweet spot for most users, while creators and gamers should look at i7/Ryzen 7 "
        "and a discrete GPU. Aim for at least 16GB of RAM and a fast NVMe SSD. Finally, "
        "weigh portability against screen size: 13–14 inches for travel, 15–16 inches "
        "for a desktop replacement.",
        "minutes": 6,
    },
    {
        "title": "MacBook Air M2 vs MacBook Pro M3: Which Should You Buy?",
        "category": "Reviews",
        "tags": ["apple", "laptops"],
        "excerpt": "We break down the real-world differences between Apple's most "
        "popular laptops to help you decide.",
        "body": "The MacBook Air M2 is the go-to for students and professionals who "
        "value portability and silent, fanless performance. The MacBook Pro M3 steps up "
        "with a brighter mini-LED display, active cooling for sustained workloads, and "
        "more ports. If you edit video, compile code, or run heavy creative apps, the "
        "Pro is worth it. Otherwise, the Air delivers exceptional value.",
        "minutes": 5,
    },
    {
        "title": "5 Ways to Speed Up Your Windows Laptop",
        "category": "Tech Tips",
        "tags": ["productivity"],
        "excerpt": "Simple, free tweaks that make an older laptop feel brand new.",
        "body": "1) Upgrade to an SSD if you haven't already — it's the single biggest "
        "speed boost. 2) Add more RAM. 3) Disable unnecessary startup apps. 4) Keep "
        "Windows and drivers updated. 5) Run a disk cleanup and remove bloatware. These "
        "five steps can dramatically improve responsiveness without spending much.",
        "minutes": 4,
    },
    {
        "title": "The Best Gaming Laptops Under KES 300,000",
        "category": "Buying Guides",
        "tags": ["gaming", "deals"],
        "excerpt": "Top picks that balance frame rates, build quality and value for "
        "Kenyan gamers.",
        "body": "You don't need to spend a fortune for a great gaming experience. "
        "Look for an RTX 4060 or 4070 GPU, a 144Hz+ display, and solid cooling. The "
        "ASUS ROG Strix and MSI Katana lines both offer excellent price-to-performance. "
        "Prioritise refresh rate and thermals over flashy RGB — your frame rates will "
        "thank you.",
        "minutes": 7,
    },
]

REVIEW_SNIPPETS = [
    (5, "Exceeded expectations", "Blazing fast and beautifully built. Highly recommend."),
    (4, "Great value", "Solid performance for the price. Delivery was quick."),
    (5, "Perfect for work", "Handles everything I throw at it without breaking a sweat."),
    (4, "Very happy", "Screen is gorgeous and battery lasts all day."),
]


def _placeholder_image(name: str, index: int) -> str:
    """Return a local placeholder image URL — no external network calls needed."""
    text = name[:40]
    # Alternate background colours per index so each product variant looks distinct.
    bg_colors = ["#E2E8F0", "#DBEAFE", "#DCFCE7", "#FEF9C3", "#FEE2E2", "#F3E8FF"]
    bg = bg_colors[index % len(bg_colors)]
    return f"/api/placeholder/900/700?text={text}&bg={bg}"


def seed_database() -> None:
    db.drop_all()
    db.create_all()

    admin = User(
        email="admin@smartcomputers.ke",
        first_name="Store",
        last_name="Admin",
        role="admin",
    )
    admin.set_password("admin12345")
    demo = User(
        email="demo@smartcomputers.ke", first_name="Demo", last_name="Customer"
    )
    demo.set_password("demo12345")
    db.session.add_all([admin, demo])

    categories = {}
    for name, icon, featured in CATEGORIES:
        category = Category(
            name=name, slug=slugify(name), icon=icon, is_featured=featured
        )
        categories[name] = category
        db.session.add(category)

    brands = {}
    for name, featured in BRANDS:
        brand = Brand(name=name, slug=slugify(name), is_featured=featured)
        brands[name] = brand
        db.session.add(brand)

    db.session.flush()

    for i, item in enumerate(PRODUCTS):
        product = Product(
            name=item["name"],
            slug=slugify(item["name"]),
            sku=f"SC-{1000 + i}",
            short_description=item["desc"][:180],
            description=item["desc"],
            price=item["price"],
            compare_at_price=item.get("compare"),
            stock=25 + (i % 5) * 10,
            processor=item.get("processor"),
            ram=item.get("ram"),
            storage=item.get("storage"),
            display=item.get("display"),
            graphics=item.get("graphics"),
            specs={
                "Processor": item.get("processor"),
                "Memory": item.get("ram"),
                "Storage": item.get("storage"),
                "Display": item.get("display"),
                "Graphics": item.get("graphics"),
                "Warranty": "1 Year",
            },
            warranty="1 Year Manufacturer Warranty",
            is_featured=item.get("featured", False),
            is_best_seller=item.get("best", False),
            is_flash_sale=item.get("flash", False),
            flash_sale_ends_at=datetime.utcnow() + timedelta(days=3)
            if item.get("flash")
            else None,
            category_id=categories[item["category"]].id,
            brand_id=brands[item["brand"]].id,
        )
        for j in range(3):
            product.images.append(
                ProductImage(
                    url=_placeholder_image(item["name"], j),
                    alt=item["name"],
                    position=j,
                )
            )
        db.session.add(product)
        db.session.flush()

        for k, (rating, title, body) in enumerate(REVIEW_SNIPPETS[: 2 + i % 3]):
            db.session.add(
                Review(
                    product_id=product.id,
                    user_id=demo.id,
                    rating=rating,
                    title=title,
                    body=body,
                )
            )
        db.session.flush()
        product.recompute_rating()

    # -----------------------------------------------------------------------
    # Seed product variants for configurable products
    # -----------------------------------------------------------------------
    # Variant definitions: product name → list of (attributes, price_modifier)
    # Price modifier is added to the base product price.
    VARIANT_DEFS = {
        "HP EliteBook 840 G10": {
            "ram": ["8GB", "16GB", "32GB"],
            "storage": ["256GB SSD", "512GB SSD", "1TB SSD"],
            "processor": ["Intel Core i5-1345U", "Intel Core i7-1365U", "Intel Core i9-1395U"],
            "color": ["Silver", "Black", "Blue"],
        },
        "Dell XPS 15 Ultrabook": {
            "ram": ["16GB", "32GB", "64GB"],
            "storage": ["512GB SSD", "1TB SSD", "2TB SSD"],
            "processor": ["Intel Core i7-13700H", "Intel Core i9-13900H"],
            "color": ["Silver", "Graphite"],
        },
        "MacBook Pro 14 M3 Pro": {
            "ram": ["18GB", "36GB"],
            "storage": ["512GB SSD", "1TB SSD", "2TB SSD"],
            "processor": ["Apple M3 Pro", "Apple M3 Max"],
            "color": ["Silver", "Space Black"],
        },
        "ASUS ROG Strix G16 Gaming Laptop": {
            "ram": ["16GB", "32GB", "64GB"],
            "storage": ["1TB SSD", "2TB SSD"],
            "processor": ["Intel Core i9-14900HX"],
            "color": ["Black", "Gray"],
        },
        "MSI Katana 15 Gaming Laptop": {
            "ram": ["16GB", "32GB"],
            "storage": ["1TB SSD", "2TB SSD"],
            "processor": ["Intel Core i7-13620H", "Intel Core i9-13900H"],
            "color": ["Black"],
        },
        "MacBook Air 13 M2": {
            "ram": ["8GB", "16GB", "24GB"],
            "storage": ["256GB SSD", "512GB SSD", "1TB SSD"],
            "processor": ["Apple M2"],
            "color": ["Silver", "Space Gray", "Midnight", "Starlight"],
        },
    }

    # Price adjustments per attribute (KES added to base price)
    RAM_PRICES = {"8GB": 0, "16GB": 15000, "18GB": 0, "24GB": 30000, "32GB": 35000, "36GB": 20000, "64GB": 70000}
    STORAGE_PRICES = {"256GB SSD": 0, "512GB SSD": 10000, "1TB SSD": 25000, "2TB SSD": 55000}
    CPU_PRICES = {
        "Intel Core i5-1345U": 0, "Intel Core i7-1365U": 25000, "Intel Core i9-1395U": 55000,
        "Intel Core i7-13700H": 0, "Intel Core i9-13900H": 30000,
        "Intel Core i7-13620H": 0, "Intel Core i9-13900H": 30000,
        "Intel Core i9-14900HX": 0,
        "Apple M2": 0, "Apple M3 Pro": 0, "Apple M3 Max": 40000,
    }

    # Create variants only for products that have definitions
    for product in Product.query.all():
        defs = VARIANT_DEFS.get(product.name)
        if not defs:
            continue

        variant_index = 0
        # Generate a subset of combinations (full cartesian could be huge)
        # For RAM, Storage, Processor: generate all combos if manageable, else sample
        ram_options = defs.get("ram", ["16GB"])
        storage_options = defs.get("storage", ["512GB SSD"])
        cpu_options = defs.get("processor", [product.processor or ""])
        color_options = defs.get("color", ["Silver"])

        # Limit combinations to a reasonable number (max ~16)
        import itertools

        all_combos = list(itertools.product(ram_options, storage_options, cpu_options, color_options))

        # If too many combos, take a representative sample
        if len(all_combos) > 20:
            import random
            random.seed(hash(product.name))
            all_combos = random.sample(all_combos, 16)

        for ram, storage, cpu, color in all_combos:
            price_adj = (
                RAM_PRICES.get(ram, 0)
                + STORAGE_PRICES.get(storage, 0)
                + CPU_PRICES.get(cpu, 0)
            )
            variant_price = max(float(product.price) + price_adj, 0)
            variant_sku = f"{product.sku}-V{variant_index + 1}"

            variant = ProductVariant(
                product_id=product.id,
                sku=variant_sku,
                price=variant_price,
                stock=5 + (variant_index % 10) * 3,
                attributes={
                    "ram": ram,
                    "storage": storage,
                    "processor": cpu,
                    "color": color,
                },
                image_url=None,  # Use product image by default
                is_active=True,
            )
            db.session.add(variant)
            variant_index += 1

    db.session.flush()

    db.session.add_all(
        [
            Coupon(
                code="WELCOME10",
                description="10% off your first order",
                discount_type="percent",
                amount=10,
                min_subtotal=10000,
            ),
            Coupon(
                code="SAVE5000",
                description="KES 5,000 off orders above 150,000",
                discount_type="fixed",
                amount=5000,
                min_subtotal=150000,
            ),
        ]
    )

    blog_categories = {}
    for name in BLOG_CATEGORIES:
        cat = BlogCategory(name=name, slug=slugify(name))
        blog_categories[name] = cat
        db.session.add(cat)

    blog_tags = {}
    for name in BLOG_TAGS:
        tag = BlogTag(name=name.title(), slug=slugify(name))
        blog_tags[name] = tag
        db.session.add(tag)

    db.session.flush()

    for post in BLOG_POSTS:
        db.session.add(
            BlogPost(
                title=post["title"],
                slug=slugify(post["title"]),
                excerpt=post["excerpt"],
                body=post["body"],
                cover_image=_placeholder_image(post["title"], 0),
                reading_minutes=post["minutes"],
                category_id=blog_categories[post["category"]].id,
                tags=[blog_tags[t] for t in post["tags"]],
                meta_description=post["excerpt"],
            )
        )

    db.session.commit()


def register_seed_command(app: Flask) -> None:
    @app.cli.command("seed")
    def seed_command() -> None:  # pragma: no cover - CLI wrapper
        """Populate the database with demo catalog data."""
        seed_database()
        click.echo("Database seeded with demo catalog data.")
