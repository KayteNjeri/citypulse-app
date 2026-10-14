# server/routes/events.py
from flask import Blueprint, jsonify, request
from ticketmaster import fetch_events, TicketmasterError

events_bp = Blueprint("events", __name__)


def error(code, message, status):
    return jsonify(error={"code": code, "message": message}), status


@events_bp.get("")
@events_bp.get("/")
def list_events():
    try:
        events = fetch_events(
            keyword=request.args.get("keyword"),
            city=request.args.get("city"),
            category=request.args.get("category"),
            start_date=request.args.get("startDate"),
            end_date=request.args.get("endDate"),
        )
    except TicketmasterError as exc:
        status = 500 if exc.code == "missing_api_key" else 502
        return error(exc.code, exc.message, status)

    return jsonify(data=events), 200