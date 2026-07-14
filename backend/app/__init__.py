"""Application factory for the SmartComputers.ke API."""
from __future__ import annotations

from flask import Flask, jsonify

from config import Config, get_config

from .extensions import cors, db, jwt, mail, migrate


def create_app(config: type[Config] | str | None = None) -> Flask:
    app = Flask(__name__)

    if isinstance(config, str) or config is None:
        config = get_config(config if isinstance(config, str) else None)
    app.config.from_object(config)

    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _register_cli(app)

    @app.get("/api/health")
    def health() -> tuple:
        return jsonify({"status": "ok", "service": "smartcomputers-api"}), 200

    return app


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )


def _register_blueprints(app: Flask) -> None:
    from .api import register_api

    register_api(app)


def _register_error_handlers(app: Flask) -> None:
    from .utils.errors import ApiError

    @app.errorhandler(ApiError)
    def handle_api_error(exc: ApiError):
        return jsonify(exc.to_dict()), exc.status_code

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(_):
        return (
            jsonify({"error": "server_error", "message": "Internal server error"}),
            500,
        )


def _register_cli(app: Flask) -> None:
    from .seed import register_seed_command

    register_seed_command(app)
