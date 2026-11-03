"""Flask application factory.

Creates and configures the Flask app, initialises Firebase Admin SDK,
Flask-Mail, CORS, and registers all route blueprints.
"""

import logging
import os

import firebase_admin
from firebase_admin import credentials
from flask import Flask
from flask_cors import CORS
from flask_mail import Mail

from app.config import Config

mail = Mail()
logger = logging.getLogger(__name__)


def create_app(config_class=Config) -> Flask:
    """Create and configure the Flask application.

    Args:
        config_class: Configuration class to use (default: Config).

    Returns:
        Configured Flask app instance.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --------------- Logging ---------------
    logging.basicConfig(
        level=logging.DEBUG if app.config.get("DEBUG") else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # --------------- Firebase Admin SDK ---------------
    if not firebase_admin._apps:
        cred_path = app.config.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                "projectId": app.config.get("FIREBASE_PROJECT_ID"),
            })
            logger.info("Firebase Admin SDK initialised with service account.")
        else:
            # On Cloud Run, default credentials are available automatically
            firebase_admin.initialize_app(options={
                "projectId": app.config.get("FIREBASE_PROJECT_ID"),
            })
            logger.info("Firebase Admin SDK initialised with default credentials.")

    # --------------- Flask-Mail ---------------
    mail.init_app(app)

    # --------------- CORS ---------------
    CORS(app, resources={r"/api/*": {
        "origins": [
            app.config.get("FRONTEND_URL", "http://localhost:5173"),
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        "supports_credentials": True,
    }})

    # --------------- Register Blueprints ---------------
    from app.routes.auth_routes import auth_bp
    from app.routes.users import users_bp
    from app.routes.donors import donors_bp
    from app.routes.inventory import inventory_bp
    from app.routes.requests import requests_bp
    from app.routes.camps import camps_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(donors_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(camps_bp)
    app.register_blueprint(notifications_bp)

    # --------------- Health Check ---------------
    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "healthy", "service": "blood-bank-api"}, 200

    logger.info("Flask app created successfully.")
    return app
