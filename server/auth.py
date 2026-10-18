"""Temporary local-only auth adapter; replace with verified JWT auth before release."""
from functools import wraps

from flask import request, Flask, g, current_app, jsonify
import jwt
from flask_jwt_extended import verify_jwt_in_request

from models import User
from extensions import db

app= Flask(__name__)
#app.config["JWT_SECRET_KEY"] = "test_key"

def require_user(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        token = request.cookies.get('token')

        if not current_app.config.get("SECRET_KEY", False):
            return jsonify(error={
                            "message": "Data not available",
                        }), 503
        else:
            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = User.query.filter(name=data["name"]).first()
            except:
                return jsonify({"msg": "Token Unavailable, Please log in!"}), 401
            
        user = db.session.get(User,current_app.config["DEV_AUTH_USER_ID"])

        if user is None:
            return jsonify(error={
                "code": "dev_user_missing",
                "message": "Run python seed.py to create the development user",
            }), 503
        g.current_user = user

        return view(current_user, *args, **kwargs)
    return wrapped


        
