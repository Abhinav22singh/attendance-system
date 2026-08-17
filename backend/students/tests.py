import base64
from io import BytesIO
from unittest.mock import patch

import numpy as np
from PIL import Image
from rest_framework.test import APITestCase
from rest_framework import status


def make_image_data_url():
    img = Image.new("RGB", (10, 10), color="red")
    buf = BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


FAKE_STUDENTS = [
    {
        "Name": "Alice",
        "Roll No": "R001",
        "Email": "alice@example.com",
        "Branch": "CSE",
        "Year": "2",
        "Semester": "3",
        "Face Encoding": "[]",
    }
]


class RegisterStudentViewTests(APITestCase):
    url = "/api/register/"

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {"name": "Bob"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("students.views.get_all_students", return_value=FAKE_STUDENTS)
    def test_duplicate_roll_no_returns_400(self, mock_get_students):
        payload = {
            "name": "Alice",
            "roll_no": "R001",
            "email": "alice@example.com",
            "branch": "CSE",
            "year": "2",
            "semester": "3",
            "image": make_image_data_url(),
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already registered", res.data["error"])

    @patch("students.views.face_recognition")
    @patch("students.views.get_all_students", return_value=[])
    def test_no_face_detected_returns_400(self, mock_get_students, mock_face_recognition):
        mock_face_recognition.face_encodings.return_value = []
        payload = {
            "name": "Charlie",
            "roll_no": "R002",
            "email": "charlie@example.com",
            "branch": "CSE",
            "year": "2",
            "semester": "3",
            "image": make_image_data_url(),
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No face detected", res.data["error"])

    @patch("students.views.add_student")
    @patch("students.views.face_recognition")
    @patch("students.views.get_all_students", return_value=[])
    def test_successful_registration(self, mock_get_students, mock_face_recognition, mock_add_student):
        mock_face_recognition.face_encodings.return_value = [np.array([0.1, 0.2, 0.3])]
        payload = {
            "name": "Charlie",
            "roll_no": "R002",
            "email": "charlie@example.com",
            "branch": "CSE",
            "year": "2",
            "semester": "3",
            "image": make_image_data_url(),
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_add_student.assert_called_once()
        self.assertIn("registered successfully", res.data["message"])


class GetStudentsViewTests(APITestCase):
    url = "/api/students/"

    @patch("students.views.get_all_students", return_value=FAKE_STUDENTS)
    def test_returns_students_without_face_encoding(self, mock_get_students):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertNotIn("Face Encoding", res.data["students"][0])

    @patch("students.views.get_all_students", side_effect=Exception("sheets down"))
    def test_sheets_error_returns_500(self, mock_get_students):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentLoginViewTests(APITestCase):
    url = "/api/student-login/"

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {"roll_no": "R001"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("students.views.get_all_students", return_value=FAKE_STUDENTS)
    def test_valid_login_returns_student(self, mock_get_students):
        res = self.client.post(self.url, {"roll_no": "R001", "name": "Alice"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["student"]["roll_no"], "R001")

    @patch("students.views.get_all_students", return_value=FAKE_STUDENTS)
    def test_unknown_student_returns_404(self, mock_get_students):
        res = self.client.post(self.url, {"roll_no": "R999", "name": "Nobody"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class NoticesViewTests(APITestCase):
    url = "/api/notices/"

    def test_returns_static_notices(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreater(len(res.data["notices"]), 0)
