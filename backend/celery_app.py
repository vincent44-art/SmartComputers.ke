"""Celery application for background jobs (emails, abandoned-cart recovery).

Start a worker with::

    celery -A celery_app.celery worker --loglevel=info

Tasks run inside a Flask app context so they can use SQLAlchemy models.
"""
from __future__ import annotations

from celery import Celery

from app import create_app


def make_celery() -> Celery:
    flask_app = create_app()
    celery = Celery(
        flask_app.import_name,
        broker=flask_app.config["CELERY_BROKER_URL"],
        backend=flask_app.config["CELERY_RESULT_BACKEND"],
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


celery = make_celery()


@celery.task(name="tasks.send_order_confirmation")
def send_order_confirmation(order_number: str) -> str:
    """Placeholder task: wire to Flask-Mail templates in production."""
    return f"queued confirmation email for {order_number}"
