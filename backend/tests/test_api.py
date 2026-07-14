"""Smoke and behaviour tests for the core API."""
from __future__ import annotations


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_list_products(client):
    res = client.get("/api/products")
    assert res.status_code == 200
    body = res.get_json()
    assert body["items"]
    assert body["meta"]["total"] >= 1


def test_product_filter_by_search(client):
    res = client.get("/api/products", query_string={"q": "laptop"})
    assert res.status_code == 200
    assert "items" in res.get_json()


def test_categories(client):
    res = client.get("/api/categories")
    assert res.status_code == 200
    assert len(res.get_json()) >= 1


def test_register_and_login(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "firstName": "New",
            "lastName": "User",
        },
    )
    assert reg.status_code in (200, 201)
    assert reg.get_json()["accessToken"]

    login = client.post(
        "/api/auth/login",
        json={"email": "newuser@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert login.get_json()["user"]["email"] == "newuser@example.com"


def test_login_rejects_bad_password(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@smartcomputers.ke", "password": "wrong"},
    )
    assert res.status_code == 401


def test_anonymous_cart_flow(client):
    headers = {"X-Session-Id": "test-session-123"}
    products = client.get("/api/products").get_json()["items"]
    product_id = products[0]["id"]

    add = client.post(
        "/api/cart/items",
        json={"productId": product_id, "quantity": 2},
        headers=headers,
    )
    assert add.status_code in (200, 201)

    cart = client.get("/api/cart", headers=headers).get_json()
    assert cart["itemCount"] == 2


def test_coupon_validation(client):
    res = client.post(
        "/api/coupons/validate",
        json={"code": "WELCOME10", "subtotal": 50000},
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["coupon"]["code"] == "WELCOME10"
    assert body["discount"] > 0


def test_blog_posts(client):
    res = client.get("/api/blog/posts")
    assert res.status_code == 200
    assert res.get_json()["items"]


def test_admin_analytics_requires_auth(client):
    res = client.get("/api/admin/analytics")
    assert res.status_code in (401, 422)


def test_admin_analytics_with_token(client, admin_token):
    res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "totals" in res.get_json()


def test_newsletter_subscribe(client):
    res = client.post(
        "/api/newsletter/subscribe", json={"email": "sub@example.com"}
    )
    assert res.status_code in (200, 201)
