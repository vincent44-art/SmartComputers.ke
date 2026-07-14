"""Authentication endpoints: register, login, refresh, profile."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
)

from ..extensions import db
from ..models import User
from ..utils.auth import current_user
from ..utils.errors import AuthError, ValidationError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _tokens_for(user: User) -> dict:
    identity = str(user.id)
    return {
        "accessToken": create_access_token(identity=identity),
        "refreshToken": create_refresh_token(identity=identity),
        "user": user.to_dict(),
    }


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or "@" not in email:
        raise ValidationError("A valid email is required")
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters")
    if User.query.filter_by(email=email).first():
        raise ValidationError("An account with this email already exists")

    user = User(
        email=email,
        first_name=(data.get("firstName") or "").strip(),
        last_name=(data.get("lastName") or "").strip(),
        phone=(data.get("phone") or "").strip() or None,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(_tokens_for(user)), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise AuthError("Invalid email or password")
    if not user.is_active:
        raise AuthError("This account has been disabled")
    return jsonify(_tokens_for(user)), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user = current_user()
    if not user:
        raise AuthError("Invalid refresh token")
    return jsonify({"accessToken": create_access_token(identity=str(user.id))}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        raise AuthError()
    return jsonify(user.to_dict()), 200
