from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request, jwt_required, current_user
from models import *
from auth import require_user
from extensions import db
from datetime import timedelta, datetime

auth_bp = Blueprint("auth", __name__)

#api = Api(app)
#api/auth/register - registrtion authentication. validate user, check for duplicates
#save to postgresql - via user model, return user details and jwt token

@require_user
def access_verfication():
    access_list = [
          "register",
          "login"
        ]
        
    if (request.endpoint) not in access_list and (not verify_jwt_in_request()):
          return {"error" : "Unauthorized"}, 401


@require_user
@auth_bp.post("/register")
def Registration():
        data = request.get_json() 
        #need to validate:
        if not data.get("name") or not data.get("password") or not data.get("email"):
            return jsonify({
                    "message": "Not enough information provided"
            })

        name = data["name"]
        password = data["password"]
        email = data["email"]

        #check for dupe emails and names
        existing_user = db.session.query(User.name).select_from(User).filter(User.name == name)
        existing_email = db.session.query(User.email).select_from(User).filter(User.email == email)
        print(existing_email)
        existing_user_output = {
            "message": "An account is already under this email account or name, try another",
        }

        #still doesn't return output correctly but registration works 
        if existing_email == email: #or existing_name:
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
       

@require_user
@auth_bp.post("/login")
def Login():
    data = request.get_json() or {}
    name = data["name"]
    password = data["password"]

    if not data.get("name") or not data.get("password"):
        return jsonify({
            "message": "Not enough information provided"
        })

    user = User( name = name, password_hash = password)

    if user and user.password_check(password):
        token = create_access_token(identity = str(User.id), expires_delta = datetime.now() + timedelta(hours=3))

        output = {
            "name": user.name,
            "token": token,
            "_message": f"Welcome... {user.name}"
        }
        output.set_cookie("token", token)

        return jsonify(output)
    
    return jsonify({"error": ['Unauthorized'], "reasons": ["Wrong Account", "Wrong Password", "You don't have an account"]}, 401)
    
@auth_bp.get("/me")
@jwt_required
def current_user_verification():
     return jsonify(id=current_user.id, 
            name= current_user.name
        )
        
        #return UserSchema().dump(user), 200
    
        #return {"error": "jwt token retrieval error, unauthorized"}, 401



             
    







       



