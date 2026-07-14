"""WSGI entrypoint used by gunicorn and the Flask CLI."""
from __future__ import annotations

from app import create_app
from app.extensions import db

app = create_app()


@app.shell_context_processor
def shell_context():  # pragma: no cover - dev convenience
    return {"db": db}
