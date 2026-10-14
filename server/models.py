"""SQLAlchemy data models for CityPulse-owned data."""
from datetime import datetime, timezone, date
from extensions import db


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    plans = db.relationship("Plan", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)


class Plan(db.Model):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text)
    event_date = db.Column(db.Date)
    city = db.Column(db.String(120))
    status = db.Column(db.String(20), nullable=False, default="saved", server_default="saved")
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    user = db.relationship("User", back_populates="plans")
    saved_events = db.relationship("SavedEvent", back_populates="plan", cascade="all, delete-orphan", passive_deletes=True)

    def serialize(self, include_events=False):
        payload = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "event_date": self.event_date.isoformat() if isinstance(self.event_date, date) else None,
            "city": self.city,
            "status": self.status,
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "event_count": len(self.saved_events),
        }  
        if include_events:
            payload["saved_events"] = [ev.serialize() for ev in self.saved_events]
        return payload
    def to_dict(self, include_events=False):
        return self.serialize(include_events=include_events)

class SavedEvent(db.Model):
    __tablename__ = "saved_events"
    __table_args__ = (db.UniqueConstraint("plan_id", "ticketmaster_id", name="uq_saved_event_plan_ticketmaster"),)

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False, index=True)
    ticketmaster_id = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    url = db.Column(db.Text)
    image = db.Column(db.Text)
    date = db.Column(db.String(80))
    time = db.Column(db.String(80))
    venue = db.Column(db.String(255))
    city = db.Column(db.String(120))
    category = db.Column(db.String(120))
    price_min = db.Column(db.Float)
    price_max = db.Column(db.Float)
    currency = db.Column(db.String(8))
    note = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default="interested")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    plan = db.relationship("Plan", back_populates="saved_events")

    @property
    def is_past(self):
        if not self.date:
            return False
        try:
            ev_date = date.fromisoformat(self.date[:10])
            return ev_date < date.today()
        except:
            return False
    @property
    def days_until(self):
        if not self.date or self.is_past:
            return None
        try:
            ev_date = date.fromisoformat(self.date[:10]) 
            delta = ev_date - date.today()
            return delta.days
        except:
            return None
        
    @property
    def days_ago(self):
        if not self.is_past:
            return 0
        try:
            ev_date = date.fromisoformat(self.date[:10]) 
            delta = date.today() - ev_date
            return delta.days
        except:
            return 0
    def serialize(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "ticketmaster_id": self.ticketmaster_id,
            "name": self.name,
            "url": self.url,
            "image": self.image,
            "date": self.date,
            "time": self.time,
            "venue": self.venue,
            "city": self.city,
            "category": self.category,
            "price_min": self.price_min,
            "price_max": self.price_max,
            "currency": self.currency,
            "note": self.note,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def to_dict(self):
        return self.serialize()