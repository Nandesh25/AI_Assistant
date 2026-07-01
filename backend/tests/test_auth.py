"""Authentication flow tests."""
from fastapi.testclient import TestClient

from tests.conftest import auth_headers, register_user


def test_register_creates_user_and_tokens(client: TestClient) -> None:
    data = register_user(client)
    assert data["user"]["username"] == "alice"
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    register_user(client)
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "username": "alice2",
            "password": "Password123",
        },
    )
    assert resp.status_code == 409


def test_login_with_username(client: TestClient) -> None:
    register_user(client)
    resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "alice", "password": "Password123"},
    )
    assert resp.status_code == 200
    assert resp.json()["tokens"]["access_token"]


def test_login_wrong_password_unauthorized(client: TestClient) -> None:
    register_user(client)
    resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "alice", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401


def test_refresh_rotates_token(client: TestClient) -> None:
    data = register_user(client)
    resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": data["tokens"]["refresh_token"]},
    )
    assert resp.status_code == 200
    new_tokens = resp.json()
    # Old refresh token must now be revoked (one-time use).
    reuse = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": data["tokens"]["refresh_token"]},
    )
    assert reuse.status_code == 401
    assert new_tokens["access_token"]


def test_protected_endpoint_with_token(client: TestClient) -> None:
    data = register_user(client)
    resp = client.get("/api/v1/auth/me", headers=auth_headers(data["tokens"]))
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"
