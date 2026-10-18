
def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_list_plans(client):
    response = client.get("/api/plans")
    assert response.status_code == 200
    assert response.json["data"][0]["title"] == "Want to go"


def test_create_plan_requires_title(client):
    response = client.post("/api/plans", json={"description": "missing title"})
    assert response.status_code == 422


def test_create_plan(client):
    response = client.post("/api/plans", json={"title": "Weekend"})
    assert response.status_code == 201
    assert response.json["data"]["title"] == "Weekend"


def test_saved_events_endpoint_returns_events_not_plans(client):
    response = client.get("/api/plans/saved")
    assert response.status_code == 200
    assert response.json["data"] == []


def test_create_and_update_saved_event(client):
    plan_id = client.get("/api/plans").json["data"][0]["id"]
    created = client.post(f"/api/plans/{plan_id}/events", json={
        "ticketmaster_id": "tm-123", "name": "Jazz Night", "status": "interested"
    })
    assert created.status_code == 201
    event_id = created.json["data"]["id"]

    updated = client.patch(f"/api/plans/events/{event_id}", json={"status": "going", "note": "Buy tickets"})
    assert updated.status_code == 200
    assert updated.json["data"]["status"] == "going"
    assert updated.json["data"]["note"] == "Buy tickets"


def test_duplicate_event_in_same_plan_is_rejected(client):
    plan_id = client.get("/api/plans").json["data"][0]["id"]
    payload = {"ticketmaster_id": "tm-123", "name": "Jazz Night"}
    assert client.post(f"/api/plans/{plan_id}/events", json=payload).status_code == 201
    duplicate = client.post(f"/api/plans/{plan_id}/events", json=payload)
    assert duplicate.status_code == 409


def test_plan_date_validation(client):
    response = client.post("/api/plans", json={"title": "Weekend", "event_date": "not-a-date"})
    assert response.status_code == 422


def test_bulk_delete_deletes_events_not_plans(client):
    plan_id = client.get("/api/plans").json["data"][0]["id"]
    created = client.post(f"/api/plans/{plan_id}/events", json={
        "ticketmaster_id": "tm-456", "name": "Comedy Night"
    })
    event_id = created.json["data"]["id"]
    response = client.delete("/api/plans/bulk-delete", json={"ids": [event_id]})
    assert response.status_code == 200
    assert response.json["deleted"] == 1
    assert client.get("/api/plans").json["data"]
    assert client.get("/api/plans/saved").json["data"] == []
