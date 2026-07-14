"""Blog and newsletter endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import BlogCategory, BlogComment, BlogPost, NewsletterSubscriber
from ..utils.errors import NotFoundError, ValidationError
from ..utils.pagination import paginate

blog_bp = Blueprint("blog", __name__, url_prefix="/api/blog")
newsletter_bp = Blueprint("newsletter", __name__, url_prefix="/api/newsletter")


@blog_bp.get("/posts")
def list_posts():
    query = BlogPost.query.filter_by(is_published=True)
    category = request.args.get("category")
    if category:
        cat = BlogCategory.query.filter_by(slug=category).first()
        if cat:
            query = query.filter(BlogPost.category_id == cat.id)
    search = request.args.get("q")
    if search:
        query = query.filter(BlogPost.title.ilike(f"%{search}%"))
    query = query.order_by(BlogPost.created_at.desc())
    return jsonify(paginate(query, lambda p: p.to_dict(), default_per_page=9)), 200


@blog_bp.get("/categories")
def list_blog_categories():
    cats = BlogCategory.query.order_by(BlogCategory.name).all()
    return jsonify([c.to_dict() for c in cats]), 200


@blog_bp.get("/posts/<slug>")
def get_post(slug: str):
    post = BlogPost.query.filter_by(slug=slug, is_published=True).first()
    if not post:
        raise NotFoundError("Post not found")
    data = post.to_dict(detail=True)
    related = (
        BlogPost.query.filter(
            BlogPost.category_id == post.category_id,
            BlogPost.id != post.id,
            BlogPost.is_published.is_(True),
        )
        .limit(3)
        .all()
    )
    data["related"] = [p.to_dict() for p in related]
    return jsonify(data), 200


@blog_bp.post("/posts/<slug>/comments")
def add_comment(slug: str):
    post = BlogPost.query.filter_by(slug=slug).first()
    if not post:
        raise NotFoundError("Post not found")
    data = request.get_json(silent=True) or {}
    author = (data.get("author") or "").strip()
    body = (data.get("body") or "").strip()
    if not author or not body:
        raise ValidationError("Name and comment are required")
    comment = BlogComment(post_id=post.id, author_name=author, body=body)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201


@newsletter_bp.post("/subscribe")
def subscribe():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email or "@" not in email:
        raise ValidationError("A valid email is required")
    if not NewsletterSubscriber.query.filter_by(email=email).first():
        db.session.add(NewsletterSubscriber(email=email))
        db.session.commit()
    return jsonify({"message": "Subscribed successfully"}), 201
