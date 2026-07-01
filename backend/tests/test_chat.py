"""Chat + messaging tests covering the core send/edit/delete flow."""
from fastapi.testclient import TestClient

from tests.conftest import auth_headers, register_user


def _two_users(client: TestClient) -> tuple[dict, dict]:
    alice = register_user(client, "alice")
    bob = register_user(client, "bob")
    return alice, bob


def test_create_direct_chat_and_send_message(client: TestClient) -> None:
    alice, bob = _two_users(client)
    a_headers = auth_headers(alice["tokens"])

    chat = client.post(
        "/api/v1/chats",
        json={"target_user_id": bob["user"]["id"]},
        headers=a_headers,
    )
    assert chat.status_code == 201
    chat_id = chat.json()["id"]

    msg = client.post(
        f"/api/v1/chats/{chat_id}/messages",
        json={"body": "Hello Bob"},
        headers=a_headers,
    )
    assert msg.status_code == 201
    assert msg.json()["body"] == "Hello Bob"


def test_direct_chat_is_idempotent(client: TestClient) -> None:
    alice, bob = _two_users(client)
    a_headers = auth_headers(alice["tokens"])
    first = client.post(
        "/api/v1/chats", json={"target_user_id": bob["user"]["id"]}, headers=a_headers
    ).json()
    second = client.post(
        "/api/v1/chats", json={"target_user_id": bob["user"]["id"]}, headers=a_headers
    ).json()
    assert first["id"] == second["id"]


def test_non_member_cannot_post(client: TestClient) -> None:
    alice, bob = _two_users(client)
    carol = register_user(client, "carol")
    chat_id = client.post(
        "/api/v1/chats",
        json={"target_user_id": bob["user"]["id"]},
        headers=auth_headers(alice["tokens"]),
    ).json()["id"]

    resp = client.post(
        f"/api/v1/chats/{chat_id}/messages",
        json={"body": "intruder"},
        headers=auth_headers(carol["tokens"]),
    )
    assert resp.status_code == 403


def test_edit_and_delete_message(client: TestClient) -> None:
    alice, bob = _two_users(client)
    a_headers = auth_headers(alice["tokens"])
    chat_id = client.post(
        "/api/v1/chats", json={"target_user_id": bob["user"]["id"]}, headers=a_headers
    ).json()["id"]
    msg_id = client.post(
        f"/api/v1/chats/{chat_id}/messages", json={"body": "typo"}, headers=a_headers
    ).json()["id"]

    edited = client.put(
        f"/api/v1/messages/{msg_id}", json={"body": "fixed"}, headers=a_headers
    )
    assert edited.status_code == 200
    assert edited.json()["is_edited"] is True

    deleted = client.delete(f"/api/v1/messages/{msg_id}", headers=a_headers)
    assert deleted.status_code == 200


def test_group_creation_and_membership(client: TestClient) -> None:
    alice, bob = _two_users(client)
    a_headers = auth_headers(alice["tokens"])
    group = client.post(
        "/api/v1/groups",
        json={"name": "Team", "member_ids": [bob["user"]["id"]]},
        headers=a_headers,
    )
    assert group.status_code == 201
    assert group.json()["name"] == "Team"
    assert len(group.json()["members"]) == 2
