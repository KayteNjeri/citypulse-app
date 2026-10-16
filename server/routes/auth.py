from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request, current_user, set_access_cookies
from models import *
from extensions import db
from datetime import timedelta, datetime

#from auth import require_user

auth_bp = Blueprint("auth", __name__)

#api = Api(app)
#api/auth/register - registrtion authentication. validate user, check for duplicates
#save to postgresql - via user model, return user details and jwt token

@auth_bp.before_request
def jwt_check():
    access_list = [
          "register",
          "login"
     ]
    if (request.endpoint) not in access_list and not (verify_jwt_in_request()):
          return {"error" : "Unauthorized"}, 401


@auth_bp.post("/register")
def Registration():
        #verify_jwt_in_request()
        data = request.get_json() or {}
        #need to validate:
        if not data.get("name") or not data.get("password") or not data.get("email"):
            return jsonify({
                    "message": "Not enough information provided"
            })

        name = data["name"]
        password = data["password"]
        email = data["email"]

        #check for dupe emails and names
        existing_user = db.session.scalars(db.select(User).where(User.email == email))
        email_test = db.session.scalars(db.select(User).where(User.name == name))

        existing_user_output = {
            "message": "An account is already under this email account, try again",
        }
          
        if not existing_user or not email_test:
            return jsonify(existing_user_output), 503

        user = User(name = name, email = email)
        user.password_hashing = password
        
        db.session.add(user)
        db.session.commit()

        new_user = UserSchema().dump(user)

        
        token = create_access_token(identity = str(user.id))
        output = {
            "user": new_user,
            "token" : token,
            "message": "Successfully created a new account" 
        }
        
        return output
       
    #unhash the password and match it with the one written



@auth_bp.post("/login")
def Login():
    verify_jwt_in_request()
    data = request.get_json() or {}

    name = data["name"]
    password = data["password"]

    if not data.get("name") or not data.get("password"):
        return jsonify({
            "message": "Not enough information provided"
        })

    user = User(id = get_jwt_identity(), name = name, password_hash = password)

    if user and user.password_check(password):
         token = create_access_token(identity = str(User.id), expires_delta = datetime.now() + timedelta(hours=1))
         return token

    
    
    return jsonify({
         "name": user.name,
         "token": token,
         "_message": f"Welcome... {user.name}"
    })
    
@auth_bp.get("/me")
def current_user_verification():
        
    if verify_jwt_in_request():
        user_id = get_jwt_identity()
        user = User.query.filter(User.id == user_id).first()
        return UserSchema().dump(user), 200
    else:
        return {"error": "jwt token retrieval error, unauthorized"}, 401



             
    







       



