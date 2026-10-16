"""Idempotent minimal local development seed."""
#from werkzeug.security import generate_password_hash
from app import create_app
from extensions import db
from models import User, Plan

app = create_app()
with app.app_context():
    db.create_all()

    db.session.query(User).delete()
    db.session.query(Plan).delete()

    print("Database tables created and previous data wiped.")
    user = User.query.filter_by(email="david.local@example.test").first()
    if user is None:
        user = User(name="Local Developer", email="david.local@example.test",
        password_hash="$2b$12$ulGcdjk9BPyrcyi86IrM3OLGh1fp9zbx18zvEw1VDP.SjYoHJ1dgK") #password is "test"

        db.session.add(user)
        db.session.commit()

    if not Plan.query.filter_by(user_id=user.id, title="Want to go").first():
        db.session.add(Plan(user_id=user.id, title="Want to go", description="Default saved events plan"))

    db.session.commit()
    print(f"Seed complete. Development user id: {user.id}")
