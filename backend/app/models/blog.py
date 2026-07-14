"""Blog models: posts, categories, tags and comments."""
from __future__ import annotations

from ..extensions import db
from .base import TimestampMixin

post_tags = db.Table(
    "post_tags",
    db.Column("post_id", db.Integer, db.ForeignKey("blog_posts.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("blog_tags.id"), primary_key=True),
)


class BlogCategory(TimestampMixin, db.Model):
    __tablename__ = "blog_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), unique=True, nullable=False, index=True)

    posts = db.relationship("BlogPost", back_populates="category")

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "slug": self.slug}


class BlogTag(db.Model):
    __tablename__ = "blog_tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "slug": self.slug}


class BlogPost(TimestampMixin, db.Model):
    __tablename__ = "blog_posts"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(280), unique=True, nullable=False, index=True)
    excerpt = db.Column(db.String(500), nullable=True)
    body = db.Column(db.Text, nullable=True)
    cover_image = db.Column(db.String(500), nullable=True)
    author_name = db.Column(db.String(160), nullable=False, default="SmartComputers Team")
    reading_minutes = db.Column(db.Integer, nullable=False, default=4)
    is_published = db.Column(db.Boolean, nullable=False, default=True)

    # SEO
    meta_title = db.Column(db.String(255), nullable=True)
    meta_description = db.Column(db.String(320), nullable=True)

    category_id = db.Column(
        db.Integer, db.ForeignKey("blog_categories.id"), nullable=True
    )
    category = db.relationship("BlogCategory", back_populates="posts")
    tags = db.relationship("BlogTag", secondary=post_tags, backref="posts")
    comments = db.relationship(
        "BlogComment", back_populates="post", cascade="all, delete-orphan"
    )

    def to_dict(self, detail: bool = False) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "excerpt": self.excerpt,
            "coverImage": self.cover_image,
            "author": self.author_name,
            "readingMinutes": self.reading_minutes,
            "category": self.category.to_dict() if self.category else None,
            "tags": [t.to_dict() for t in self.tags],
            "publishedAt": self.created_at.isoformat() if self.created_at else None,
        }
        if detail:
            data.update(
                {
                    "body": self.body,
                    "metaTitle": self.meta_title or self.title,
                    "metaDescription": self.meta_description or self.excerpt,
                    "comments": [
                        c.to_dict() for c in self.comments if c.is_approved
                    ],
                }
            )
        return data


class BlogComment(TimestampMixin, db.Model):
    __tablename__ = "blog_comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("blog_posts.id"), nullable=False)
    author_name = db.Column(db.String(160), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_approved = db.Column(db.Boolean, nullable=False, default=True)

    post = db.relationship("BlogPost", back_populates="comments")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "author": self.author_name,
            "body": self.body,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class NewsletterSubscriber(TimestampMixin, db.Model):
    __tablename__ = "newsletter_subscribers"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email}
