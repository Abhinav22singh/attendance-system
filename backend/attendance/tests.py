import base64
import json
from datetime import datetime, timedelta
from io import BytesIO
from unittest.mock import MagicMock, patch

from PIL import Image
from rest_framework.test import APITestCase
from rest_framework import status


def make_image_data_url():
    img = Image.new("RGB", (10, 10), color="blue")
    buf = BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


FAKE_STUDENT = {
    "Name": "Alice",
    "Roll No": "R001",
    "Email": "alice@example.com",
    "Branch": "CSE",
    "Year": "2",
    "Semester": "3",
    "Face Encoding": json.dumps([0.1, 0.2, 0.3]),
}


class MarkAttendanceViewTests(APITestCase):
    url = "/api/mark-attendance/"

    def test_requires_login(self):
        res = self.client.post(self.url, {"image": make_image_data_url()}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_requires_image(self):
        res = self.client.post(self.url, {"logged_roll_no": "R001"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.views.add_attendance")
    @patch("attendance.views.get_all_students", return_value=[FAKE_STUDENT])
    @patch("attendance.views.face_recognition")
    def test_marks_attendance_for_matching_student(self, mock_face_recognition, mock_get_students, mock_add_attendance):
        mock_face_recognition.face_encodings.return_value = [[0.1, 0.2, 0.3]]
        mock_face_recognition.compare_faces.return_value = [True]
        mock_face_recognition.face_distance.return_value = [0.1]

        payload = {
            "image": make_image_data_url(),
            "subject": "Maths",
            "semester": "3",
            "logged_roll_no": "R001",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["results"][0]["status"], "marked")
        mock_add_attendance.assert_called_once()

    @patch("attendance.views.get_all_students", return_value=[FAKE_STUDENT])
    @patch("attendance.views.face_recognition")
    def test_blocks_mismatched_logged_in_student(self, mock_face_recognition, mock_get_students):
        mock_face_recognition.face_encodings.return_value = [[0.1, 0.2, 0.3]]
        mock_face_recognition.compare_faces.return_value = [True]
        mock_face_recognition.face_distance.return_value = [0.1]

        payload = {
            "image": make_image_data_url(),
            "subject": "Maths",
            "semester": "3",
            "logged_roll_no": "R999",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["results"][0]["status"], "blocked")

    @patch("attendance.views.get_all_students", return_value=[FAKE_STUDENT])
    @patch("attendance.views.face_recognition")
    def test_no_face_detected_returns_400(self, mock_face_recognition, mock_get_students):
        mock_face_recognition.face_encodings.return_value = []

        payload = {
            "image": make_image_data_url(),
            "subject": "Maths",
            "semester": "3",
            "logged_roll_no": "R001",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class GetAttendanceViewTests(APITestCase):
    url = "/api/attendance/"

    @patch("attendance.views.get_sheet")
    def test_returns_parsed_records(self, mock_get_sheet):
        mock_sheet = MagicMock()
        mock_sheet.get_all_values.return_value = [
            ["Name", "Roll No", "Date", "Time", "Subject", "Semester"],
            ["Alice", "R001", "2026-01-01", "10:00:00", "Maths", "3"],
            ["", "", "", "", "", ""],
        ]
        mock_get_sheet.return_value = mock_sheet

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["records"][0]["Roll No"], "R001")

    @patch("attendance.views.get_sheet", side_effect=Exception("sheets down"))
    def test_sheets_error_returns_500(self, mock_get_sheet):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(res.data["success"])


class AttendanceStatsViewTests(APITestCase):
    url = "/api/stats/"

    @patch("attendance.stats_views.get_sheet")
    @patch("attendance.stats_views.get_all_students", return_value=[FAKE_STUDENT])
    def test_returns_stats_per_student(self, mock_get_students, mock_get_sheet):
        mock_sheet = MagicMock()
        mock_sheet.get_all_records.return_value = [
            {"Roll No": "R001", "Subject": "Maths"},
            {"Roll No": "R001", "Subject": "Maths"},
        ]
        mock_get_sheet.return_value = mock_sheet

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_students"], 1)
        self.assertEqual(res.data["stats"][0]["subjects"]["Maths"], 2)


FAKE_TEACHER = {
    "Teacher ID": "T001",
    "Password": "pass123",
    "Name": "Mr. Smith",
    "Subjects": "Maths, Physics",
    "Semester": "3",
}


class TeacherLoginViewTests(APITestCase):
    url = "/api/teacher/login/"

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {"teacher_id": "T001"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.teacher_views.get_all_teachers", return_value=[FAKE_TEACHER])
    def test_valid_credentials(self, mock_get_teachers):
        res = self.client.post(self.url, {"teacher_id": "T001", "password": "pass123"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["teacher"]["teacher_id"], "T001")
        self.assertEqual(res.data["teacher"]["subjects"], ["Maths", "Physics"])

    @patch("attendance.teacher_views.get_all_teachers", return_value=[FAKE_TEACHER])
    def test_invalid_credentials(self, mock_get_teachers):
        res = self.client.post(self.url, {"teacher_id": "T001", "password": "wrong"}, format="json")
        self.assertEqual(res.status_code, 401)


class GenerateQRViewTests(APITestCase):
    url = "/api/teacher/generate-qr/"

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {"teacher_id": "T001"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.teacher_views.add_qr_token")
    def test_generates_token(self, mock_add_qr_token):
        payload = {"teacher_id": "T001", "subject": "Maths", "semester": "3"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)
        mock_add_qr_token.assert_called_once()


class MarkAttendanceQRViewTests(APITestCase):
    url = "/api/teacher/mark-attendance/"

    def _fake_token_record(self, used="No", expires_delta=timedelta(minutes=10)):
        expires = (datetime.now() + expires_delta).strftime("%Y-%m-%d %H:%M:%S")
        return {
            "Token": "tok123",
            "Teacher ID": "T001",
            "Subject": "Maths",
            "Semester": "3",
            "Expires At": expires,
            "Used": used,
        }

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {"token": "tok123"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.teacher_views.get_all_tokens", return_value=[])
    def test_invalid_token_returns_400(self, mock_get_tokens):
        payload = {"image": make_image_data_url(), "token": "bogus"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.teacher_views.get_all_tokens")
    def test_expired_token_returns_400(self, mock_get_tokens):
        mock_get_tokens.return_value = [self._fake_token_record(expires_delta=timedelta(minutes=-10))]
        payload = {"image": make_image_data_url(), "token": "tok123"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res.data["error"])

    @patch("attendance.teacher_views.get_all_tokens")
    def test_already_used_token_returns_400(self, mock_get_tokens):
        mock_get_tokens.return_value = [self._fake_token_record(used="Yes")]
        payload = {"image": make_image_data_url(), "token": "tok123"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already used", res.data["error"])

    @patch("attendance.teacher_views.add_attendance")
    @patch("attendance.teacher_views.get_all_attendance", return_value=[])
    @patch("attendance.teacher_views.get_all_students", return_value=[FAKE_STUDENT])
    @patch("attendance.teacher_views.get_all_tokens")
    @patch("attendance.teacher_views.face_recognition")
    def test_marks_attendance_via_qr(
        self,
        mock_face_recognition,
        mock_get_tokens,
        mock_get_students,
        mock_get_all_attendance,
        mock_add_attendance,
    ):
        mock_get_tokens.return_value = [self._fake_token_record()]
        mock_face_recognition.face_encodings.return_value = [[0.1, 0.2, 0.3]]
        mock_face_recognition.compare_faces.return_value = [True]
        mock_face_recognition.face_distance.return_value = [0.1]

        payload = {"image": make_image_data_url(), "token": "tok123"}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["results"][0]["status"], "marked")
        mock_add_attendance.assert_called_once()


class TeacherRecordsViewTests(APITestCase):
    url = "/api/teacher/records/"

    def test_requires_teacher_id(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("attendance.teacher_views.get_all_teachers", return_value=[FAKE_TEACHER])
    def test_invalid_teacher_returns_401(self, mock_get_teachers):
        res = self.client.get(self.url, {"teacher_id": "T999"})
        self.assertEqual(res.status_code, 401)

    @patch("attendance.teacher_views.get_all_attendance")
    @patch("attendance.teacher_views.get_all_teachers", return_value=[FAKE_TEACHER])
    def test_returns_records_for_allowed_subjects(self, mock_get_teachers, mock_get_attendance):
        mock_get_attendance.return_value = [
            {"Subject": "Maths", "Roll No": "R001"},
            {"Subject": "History", "Roll No": "R002"},
        ]
        res = self.client.get(self.url, {"teacher_id": "T001"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["records"][0]["Subject"], "Maths")
