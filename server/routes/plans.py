from datetime import date, timedelta
from flask import Blueprint, g, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from auth import require_user
from extensions import db
from models import Plan, SavedEvent

plans_bp = Blueprint("plans", __name__)


def error(code, message, status):
    return jsonify(error={"code": code, "message": message}), status
def parse_plan_date(value):
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError("plan_date must use YYYY-MM-DD format")
    
def get_owned_plan(plan_id):
    plan = Plan.query.filter_by(id=plan_id, user_id=g.current_user.id).first()
    if plan is None:
        return None, error("not_found", "Plan not found", 404)
    return plan, None

# PLANS CRUD
@plans_bp.get("/")
@require_user
def fetch_plans():
    plans = Plan.query.filter_by(user_id=g.current_user.id).order_by(Plan.created_at.desc()).all()
    return jsonify(data=[p.serialize() for p in plans]), 200
    
@plans_bp.post("/")
@require_user
def add_plan():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("invalid_json", "A JSON object is required", 400)
    raw_title = payload.get("title", "")
    if not isinstance(raw_title, str) or not raw_title.strip():
        return error("validation_error", "title is required", 422)
    if len(raw_title.strip()) > 160:
        return error("validation_error", "title must be 160 characters or less", 422)
    try:
        p_date = parse_plan_date(payload.get("event_date"))
    except ValueError as e:
        return error("validation_error", str(e), 422)

    new_plan = Plan(
        user_id=g.current_user.id, 
        title=raw_title.strip(),
        description=str(payload.get("description") or "").strip(), 
        event_date=p_date,
        city=(str(payload.get("city") or "").strip() or None),
        is_public=bool(payload.get("is_public", False)),
        status=str(payload.get("status") or "saved").strip().lower()
    )
    db.session.add(new_plan)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return error("database_error", "Failed to create plan", 500)
    
    return jsonify(data=new_plan.serialize()), 201


@plans_bp.get("/<int:plan_id>")
@require_user
def fetch_plan(plan_id):
    plan, error = get_owned_plan(plan_id)
    if error:
        return error
    return jsonify(data=plan.serialize(include_events=True)), 200

@plans_bp.patch("/<int:plan_id>")
@require_user
def edit_plan(plan_id):
    plan, error = get_owned_plan(plan_id)
    if error:
        return error
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("invalid_json", "A JSON object is required", 400)
    if "title" in payload:
        t = payload["title"]
        if not isinstance(t, str) or not t.strip():
            return error("validation_error", "title cannot be empty", 422)
        plan.title = t.strip()
    if "description" in payload: 
        plan.description = str(payload.get("description") or "").strip()
    if "is_public" in payload:
        plan.is_public = bool(payload.get("is_public", False))
    if "city" in payload: 
        plan.city = str(payload.get("city") or "").strip() or None
    if "event_date" in payload:
        try: plan.event_date = parse_plan_date(payload["event_date"])
        except ValueError as e: return error("validation_error", str(e), 422)
    if "status" in payload:
        plan.status = str(payload.get("status") or "saved").strip() or "saved"

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return error("database_error", "Failed to update plan", 500)
    return jsonify(data=plan.serialize()), 200

@plans_bp.delete("/<int:plan_id>")
@require_user
def delete_plan(plan_id):
    plan, error = get_owned_plan(plan_id)
    if error:
        return error
    if not plan:
        return error("not_found", "Plan not found", 404)
    db.session.delete(plan)
    try: db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return error("database_error", "Failed to delete plan", 500)
    return "", 204

#SAVED EVENTS CRUD
@plans_bp.get("/saved")
@require_user
def get_all_saved_event():
    status = request.args.get("status")
    q = Plan.query.filter_by(user_id=g.current_user.id)
    if status:
        q = q.filter_by(status=status)
    
    section = request.args.get("section", "all")

    evs = q.order_by(Plan.event_date.desc()).all()

    if section == "upcoming":
        evs = [e for e in evs if e.event_date and e.event_date >= date.today()]
    elif section == "previous":
        evs = [e for e in evs if e.event_date and e.event_date < date.today()]
    elif section == "interested_soon":
        evs = [e for e in evs if e.status == "interested" and e.event_date and 0 <= (e.event_date - date.today()).days <= 5]
    return jsonify(data=[e.serialize() for e in evs]), 200
 
@plans_bp.delete("/events/<int:event_id>")
@require_user
def delete_saved_event(event_id):
    ev = db.session.query(SavedEvent).join(Plan).filter(
        Plan.user_id == g.current_user.id, 
        SavedEvent.id == event_id,
        SavedEvent.plan_id == Plan.id
    ).first()
    if not ev:
        return error("not_found", "Saved event not found", 404)
    db.session.delete(ev)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return error("database_error", "Failed to delete saved event", 500)
    return "", 204

@plans_bp.delete("/bulk-delete")
@require_user
def bulk_delete_saved_events():
    payload = request.get_json() or {}
    ids = payload.get("ids", [])
    if not ids or not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        return error("validation_error", "A list of integer IDs is required", 422)
    Plan.query.filter(
        Plan.user_id == g.current_user.id,
        Plan.id.in_(ids)
    ).delete(synchronize_session=False)
    db.session.commit()
    return jsonify(message=f"Deleted {len(ids)} events"), 200

@plans_bp.get("/notifications/upcoming")
@require_user
def get_notifications():
    today = date.today()
    next_week = today + timedelta(days=7)
    evs = Plan.query.filter(
        Plan.user_id ==g.current_user.id,
        Plan.event_date >= today,
        Plan.event_date <= next_week
    ).order_by(Plan.event_date.asc()).all()
    upcoming_events = []
    return jsonify({
        "count": len(evs),
        "data": [e.serialize() for e in evs],
        "has_notifications": any(e.event_date and today <= e.event_date <= next_week for e in evs)
    }), 200