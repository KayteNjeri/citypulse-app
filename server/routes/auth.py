"""Registration and JWT login endpoints."""
import random
from datetime import timedelta, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)

def public_user(user):
    return {"id": user.id, "name": user.name, "email": user.email}

def send_fake_email(to, code):
    print("\n" + "=" * 40)
    print(f"Sending fake email to {to}")
    print(f"Your verification code is: {code}")
    print("=" * 40 + "\n")

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
    code = str(random.randint(10000, 99999))
    user = User(name=name, email=email, password_hash="")
    user.set_password(password)
    user.verification_code = code
    user.code_expires_at = datetime.utcnow() + timedelta(minutes=5)
    user.is_verified = False
    db.session.add(user)
    db.session.commit()
    send_fake_email(email, code)
    
    return jsonify(data={
        "message": "Verification code sent to email", 
        "need_verification": True,
        "email": email
    }), 201

@auth_bp.post("/verify-email")
def verify_email():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower() 
    code = data.get("code", "").strip()
    user = User.query.filter_by(email=email).first()
    if not email or not code:
        return jsonify(error={"code": "validation_error", "message": "Email and verification code are required."}), 422
    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify(error={"code": "not_found", "message": "User not found."}), 404
    if user.verification_code != code:
        return jsonify(error={"code": "invalid_code", "message": "Invalid verification code."}), 400
    if datetime.utcnow() > user.code_expires_at:
        return jsonify(error={"code": "expired_code", "message": "Verification code has expired, Register again."}), 400
    user.is_verified = True
    user.verification_code = None
    user.code_expires_at = None
    db.session.commit()
    token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=3))
    return jsonify(data={"user": public_user(user), "token": token}), 200

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

@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower() 
    user = User.query.filter_by(email=email).first()
    if not email:
        return jsonify(error={"code": "validation_error", "message": "Email is required."}), 422
    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify(error={"code": "not_found", "message": "User not found."}), 404
    code = str(random.randint(10000, 99999))
    user.reset_code = code
    user.reset_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.session.commit()
    send_fake_email(email, code)
    return jsonify(data={"message": "Reset code sent to email"}), 200

@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower() 
    code = data.get("code", "").strip()
    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        return jsonify(error={"code": "validation_error", "message": "Password must be at least have 8 characters."}), 422
    user = User.query.filter_by(email=email).first()
    if not user or user.reset_code != code:
        return jsonify(error={"code": "invalid_code", "message": "Invalid reset code."}), 400
    if datetime.utcnow() > user.reset_expires_at:
        return jsonify(error={"code": "expired_code", "message": "Reset code has expired."}), 400
    user.set_password(new_password)
    user.reset_code = None
    user.reset_expires_at = None
    db.session.commit()
    return jsonify(data={"message": "Password reset successfully, login now."}), 200

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
