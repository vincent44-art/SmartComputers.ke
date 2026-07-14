"""Pytest fixtures: a Flask app + client backed by an in-memory SQLite DB."""
from __future__ import annotations

import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database
from config import TestingConfig


@pytest.fixture()
def app():
    application = create_app(TestingConfig)
    with application.app_context():
        seed_database()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def admin_token(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@smartcomputers.ke", "password": "admin12345"},
    )
    return res.get_json()["accessToken"]
