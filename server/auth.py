"""Authentication decorator shared by protected API routes."""
from functools import wraps

from flask import current_app, g, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from extensions import db
from models import User

def require_user(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        # Explicitly opt-in local test/development adapter; never enable in production.
        if current_app.config.get("DEV_AUTH_STUB", False) and current_app.testing:
            user = db.session.get(User, current_app.config.get("DEV_AUTH_USER_ID", 1))
        else:
            try:
                verify_jwt_in_request()
                identity = get_jwt_identity()
                user_id = int(identity)
                user = db.session.get(User, user_id)
            except (TypeError, ValueError):
                user = None
            except Exception:
                return jsonify(error={"code": "unauthorized", "message": "A valid bearer token is required."}), 401

        if user is None:
            return jsonify(error={"code": "unauthorized", "message": "Authentication required."}), 401
        g.current_user = user
        return view(*args, **kwargs)
    return wrapped
