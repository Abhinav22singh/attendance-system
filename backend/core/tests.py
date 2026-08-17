from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


@override_settings(ADMIN_USERNAME="admin", ADMIN_PASSWORD="test-pass")
class AdminLoginViewTests(APITestCase):
    url = "/api/admin/login/"

    def test_valid_credentials_returns_token(self):
        res = self.client.post(self.url, {"username": "admin", "password": "test-pass"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_invalid_credentials_returns_401(self):
        res = self.client.post(self.url, {"username": "admin", "password": "wrong"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminVerifyViewTests(APITestCase):
    url = "/api/admin/verify/"

    def test_missing_auth_header_returns_401(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 401)

    def test_bearer_header_returns_valid(self):
        # AdminVerifyView's own check just looks for a "Bearer " prefix, but
        # DRF's globally configured JWTAuthentication runs first during
        # dispatch and will 401 on a token it can't decode, so a real JWT
        # is required here even though the view logic itself doesn't
        # otherwise validate the token content.
        access_token = str(RefreshToken().access_token)
        res = self.client.get(self.url, HTTP_AUTHORIZATION=f"Bearer {access_token}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Valid")
