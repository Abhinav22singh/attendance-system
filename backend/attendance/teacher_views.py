import secrets
import json
import numpy as np
import base64
import face_recognition

from PIL import Image
from io import BytesIO
from datetime import datetime, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response

from students.sheets import (
    get_all_teachers,
    get_all_students,
    get_all_tokens,
    add_qr_token,
    add_attendance,
    get_all_attendance,
)


# ================= TEACHER LOGIN =================

class TeacherLoginView(APIView):

    def post(self, request):

        teacher_id = request.data.get("teacher_id", "").strip()
        password = request.data.get("password", "").strip()

        if not teacher_id or not password:
            return Response({"error": "All fields required"}, status=400)

        teachers = get_all_teachers()

        teacher = next(
            (
                t for t in teachers
                if str(t["Teacher ID"]).strip() == teacher_id
                and str(t["Password"]).strip() == password
            ),
            None
        )

        if not teacher:
            return Response({"error": "Invalid credentials"}, status=401)

        return Response({
            "message": "Login successful",
            "teacher": {
                "teacher_id": teacher["Teacher ID"],
                "name": teacher["Name"],
                "subjects": [s.strip() for s in str(teacher["Subjects"]).split(",")],
                "semester": teacher["Semester"]
            }
        })


# ================= GENERATE QR =================

class GenerateQRView(APIView):

    def post(self, request):

        teacher_id = request.data.get("teacher_id")
        subject = request.data.get("subject")
        semester = request.data.get("semester")

        if not all([teacher_id, subject, semester]):
            return Response({"error": "All fields required"}, status=400)

        token = secrets.token_urlsafe(32)
        now = datetime.now()
        expires = now + timedelta(minutes=15)
        expires_str = expires.strftime("%Y-%m-%d %H:%M:%S")

        add_qr_token({
            "token": token,
            "teacher_id": teacher_id,
            "subject": subject,
            "semester": str(semester),
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "expires_at": expires_str,
        })

        return Response({
            "token": token,
            "subject": subject,
            "semester": semester,
            "expires_at": expires_str,
            "qr_data": json.dumps({
                "token": token,
                "subject": subject,
                "semester": str(semester),
                "teacher_id": teacher_id,
                "expires_at": expires_str
            })
        })


# ================= MARK ATTENDANCE =================

class MarkAttendanceQRView(APIView):

    def post(self, request):

        image_b64 = request.data.get("image")
        token = request.data.get("token")

        print("TOKEN RECEIVED:", token)
        print("IMAGE RECEIVED:", bool(image_b64))

        if not image_b64 or not token:
            return Response({"error": "Image and token required"}, status=400)

        # ── Validate token ──
        tokens = get_all_tokens()
        print("ALL TOKENS:", [t.get("Token", "") for t in tokens])

        token_record = next(
            (t for t in tokens if str(t["Token"]).strip() == str(token).strip()),
            None
        )

        print("TOKEN RECORD:", token_record)

        if not token_record:
            return Response({"error": "❌ Invalid QR code"}, status=400)

        used_value = str(token_record.get("Used", "No")).strip().lower()
        if used_value == "yes":
            return Response({"error": "❌ QR already used"}, status=400)

        expiry_raw = str(token_record.get("Expires At", "")).strip()
        print("EXPIRY RAW:", expiry_raw)

        if not expiry_raw:
            return Response({"error": "Expiry missing in sheet"}, status=400)

        try:
            expires_at = datetime.strptime(expiry_raw, "%Y-%m-%d %H:%M:%S")
            if datetime.now() > expires_at:
                return Response({"error": "❌ QR expired"}, status=400)
        except Exception as e:
            return Response({"error": f"Invalid expiry format: {e}"}, status=400)

        subject = str(token_record["Subject"]).strip()
        semester = str(token_record["Semester"]).strip()
        teacher_id = str(token_record.get("Teacher ID", "")).strip()

        # ── Face Recognition ──
        try:
            img_data = base64.b64decode(image_b64.split(",")[1])
            img = Image.open(BytesIO(img_data)).convert("RGB")
            img_array = np.array(img)

            unknown_encodings = face_recognition.face_encodings(img_array)

            if not unknown_encodings:
                return Response({"error": "❌ No face detected"}, status=400)

            students = get_all_students()
            known_encodings = []
            known_students = []

            for s in students:
                try:
                    enc = np.array(json.loads(s["Face Encoding"]))
                    known_encodings.append(enc)
                    known_students.append(s)
                except:
                    pass

            if not known_encodings:
                return Response({"error": "No student encodings found"}, status=400)

            results = []
            all_attendance = get_all_attendance()

            for unknown_enc in unknown_encodings:

                matches = face_recognition.compare_faces(
                    known_encodings, unknown_enc, tolerance=0.5
                )
                distances = face_recognition.face_distance(
                    known_encodings, unknown_enc
                )

                if True not in matches:
                    results.append({
                        "status": "unknown",
                        "message": "❌ Face not recognized"
                    })
                    continue

                best_idx = int(np.argmin(distances))
                student = known_students[best_idx]
                roll_no = str(student["Roll No"]).strip()

                # ── Duplicate check by token ──
                already_marked = any(
                    str(r.get("Roll No", "")).strip() == roll_no
                    and str(r.get("Token", "")).strip() == token
                    for r in all_attendance
                )

                if already_marked:
                    results.append({
                        "status": "duplicate",
                        "message": f"⚠️ {student['Name']} already marked"
                    })
                    continue

                now = datetime.now()
                add_attendance({
                    "name": student["Name"],
                    "roll_no": roll_no,
                    "date": now.strftime("%Y-%m-%d"),
                    "time": now.strftime("%H:%M:%S"),
                    "subject": subject,
                    "semester": semester,
                    "token": token,
                    "teacher_id": teacher_id,
                })

                results.append({
                    "status": "marked",
                    "message": f"✅ {student['Name']} attendance marked"
                })

            return Response({
                "results": results,
                "subject": subject,
                "semester": semester
            })

        except Exception as e:
            print("FACE ERROR:", e)
            return Response({"error": str(e)}, status=500)


# ================= TEACHER RECORDS =================

class TeacherRecordsView(APIView):

    def get(self, request):

        teacher_id = request.query_params.get("teacher_id")
        subject = request.query_params.get("subject", "")
        semester = request.query_params.get("semester", "")

        if not teacher_id:
            return Response({"error": "Teacher ID required"}, status=400)

        teachers = get_all_teachers()
        teacher = next(
            (t for t in teachers if str(t["Teacher ID"]).strip() == str(teacher_id).strip()),
            None
        )

        if not teacher:
            return Response({"error": "Invalid teacher"}, status=401)

        allowed_subjects = [s.strip() for s in str(teacher["Subjects"]).split(",")]
        records = get_all_attendance()

        records = [r for r in records if str(r.get("Subject", "")).strip() in allowed_subjects]

        if subject:
            records = [r for r in records if str(r.get("Subject", "")).strip().lower() == subject.lower()]
        if semester:
            records = [r for r in records if str(r.get("Semester", "")).strip() == str(semester)]

        return Response({
            "records": records,
            "count": len(records),
            "allowed_subjects": allowed_subjects
        })