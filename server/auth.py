"""Temporary local-only auth adapter; replace with verified JWT auth before release."""
from functools import wraps

from flask import current_app, g, jsonify

from models import User
from extensions import db

def require_user(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        # This is a development identity stub, not authentication. Never enable in production.
        if not current_app.config.get("DEV_AUTH_STUB", False):
            return jsonify(error={
                "code": "auth_not_configured",
                "message": "JWT authentication is not configured yet",
            }), 503
        user = db.session.get(User,current_app.config["DEV_AUTH_USER_ID"]
)
        if user is None:
            return jsonify(error={
                "code": "dev_user_missing",
                "message": "Run python seed.py to create the development user",
            }), 503
        g.current_user = user
        return view(*args, **kwargs)
    return wrapped
