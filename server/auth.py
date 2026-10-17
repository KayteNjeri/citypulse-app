"""Temporary local-only auth adapter; replace with verified JWT auth before release."""
from functools import wraps

from flask import request, Flask, g, current_app, jsonify
import jwt
from flask_jwt_extended import verify_jwt_in_request

from models import User
from extensions import db

app= Flask(__name__)

def require_user(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        token = request.cookies.get('token')

        if not token:
            return jsonify({"msg": "No token available - Unauthorized"}), 401

        try:
            data = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(id = data["id"]).all()
        except:
            return jsonify({"msg": "Invalid Token!!!!!"}), 401

        user = db.session.get(User, current_app.config["JWT_SECRET_KEY"])
        if user is None:
            return jsonify(error={
                "code": "dev_user_missing",
                "message": "Run python seed.py to create the development user",
            }), 503
        g.current_user = user

        return view( *args, **kwargs)
    return wrapped

        
