"""Registration and JWT login endpoints."""
from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


def public_user(user):
    return {"id": user.id, "name": user.name, "email": user.email}


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip() if isinstance(data.get("name"), str) else ""
    email = data.get("email", "").strip().lower() if isinstance(data.get("email"), str) else ""
    password = data.get("password")
    if not name or not email or not isinstance(password, str) or len(password) < 8:
        return jsonify(error={"code": "validation_error", "message": "Name, email, and a password of at least 8 characters are required."}), 422
    if User.query.filter((User.email == email) | (User.name == name)).first():
        return jsonify(error={"code": "account_exists", "message": "An account with that email or name already exists."}), 409
    user = User(name=name, email=email, password_hash="")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=3))
    return jsonify(data={"user": public_user(user), "token": token}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower() if isinstance(data.get("email"), str) else ""
    password = data.get("password")
    if not email or not isinstance(password, str):
        return jsonify(error={"code": "validation_error", "message": "Email and password are required."}), 422
    user = User.query.filter_by(email=email).first()
    if user is None or not user.password_check(password):
        return jsonify(error={"code": "unauthorized", "message": "Invalid email or password."}), 401
    token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=3))
    return jsonify(data={"user": public_user(user), "token": token}), 200


@auth_bp.get("/me")
@jwt_required()
def current_user_verification():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify(error={"code": "unauthorized", "message": "Invalid token identity."}), 401
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify(error={"code": "unauthorized", "message": "User no longer exists."}), 401
    return jsonify(data={"user": public_user(user)}), 200
