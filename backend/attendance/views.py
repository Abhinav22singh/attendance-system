import face_recognition
import numpy as np
import base64
import json
import csv
from datetime import datetime
from PIL import Image
from io import BytesIO, StringIO
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from students.sheets import get_all_students, add_attendance, get_sheet


class MarkAttendanceView(APIView):
    def post(self, request):
        image_b64 = request.data.get("image")
        subject = request.data.get("subject", "General")
        semester = request.data.get("semester", "")
        logged_roll_no = request.data.get("logged_roll_no")

        if not logged_roll_no:
            return Response({"error": "Login required"}, status=401)

        if not image_b64:
            return Response({"error": "Image required"}, status=400)

        if not subject:
            return Response({"error": "Subject required"}, status=400)

        if not semester:
            return Response({"error": "Semester required"}, status=400)

        try:
            img_data = base64.b64decode(image_b64.split(",")[1])
            img = Image.open(BytesIO(img_data)).convert("RGB")
            img_array = np.array(img)

            unknown_encodings = face_recognition.face_encodings(img_array)

            if not unknown_encodings:
                return Response({"error": "No face detected"}, status=400)

            students = get_all_students()

            known_encodings = []
            known_students = []

            for s in students:
                try:
                    face_encoding = s.get("Face Encoding", "")
                    if not face_encoding:
                        continue

                    enc = np.array(json.loads(face_encoding))
                    known_encodings.append(enc)
                    known_students.append(s)
                except Exception:
                    continue

            if not known_encodings:
                return Response({"error": "No valid face encodings found"}, status=400)

            results = []

            for unknown_enc in unknown_encodings:
                matches = face_recognition.compare_faces(
                    known_encodings,
                    unknown_enc,
                    tolerance=0.5,
                )

                distances = face_recognition.face_distance(
                    known_encodings,
                    unknown_enc,
                )

                if True in matches:
                    best_idx = int(np.argmin(distances))
                    student = known_students[best_idx]

                    student_roll = str(student.get("Roll No", "")).strip()
                    logged_roll = str(logged_roll_no).strip()

                    if student_roll != logged_roll:
                        results.append({
                            "name": student.get("Name", ""),
                            "roll_no": student_roll,
                            "status": "blocked",
                            "message": "Face does not match logged-in student",
                        })
                        continue

                    now = datetime.now()

                    add_attendance({
                        "name": student.get("Name", ""),
                        "roll_no": student_roll,
                        "date": now.strftime("%Y-%m-%d"),
                        "time": now.strftime("%H:%M:%S"),
                        "subject": subject,
                        "semester": semester,
                    })

                    results.append({
                        "name": student.get("Name", ""),
                        "roll_no": student_roll,
                        "subject": subject,
                        "semester": semester,
                        "status": "marked",
                    })

                else:
                    results.append({
                        "status": "unknown",
                        "message": "Face not recognized",
                    })

            return Response({"results": results})

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class GetAttendanceView(APIView):
    def get(self, request):
        try:
            subject = request.query_params.get("subject", "").strip().lower()
            semester = request.query_params.get("semester", "").strip()

            sheet = get_sheet("Attendance")

            # Read raw rows instead of get_all_records()
            rows = sheet.get_all_values()

            fixed_records = []

            for row in rows:
                # Skip empty rows
                if not row or all(str(cell).strip() == "" for cell in row):
                    continue

                # Skip header row if present
                first_cell = str(row[0]).strip().lower()
                if first_cell in ["name", "student name"]:
                    continue

                # Expected row order:
                # Name | Roll No | Date | Time | Subject | Semester
                record = {
                    "Name": row[0].strip() if len(row) > 0 else "",
                    "Roll No": row[1].strip() if len(row) > 1 else "",
                    "Date": row[2].strip() if len(row) > 2 else "",
                    "Time": row[3].strip() if len(row) > 3 else "",
                    "Subject": row[4].strip() if len(row) > 4 else "",
                    "Semester": row[5].strip() if len(row) > 5 else "",
                }

                if not any(str(v).strip() for v in record.values()):
                    continue

                if subject and record["Subject"].strip().lower() != subject:
                    continue

                if semester and record["Semester"].strip() != semester:
                    continue

                fixed_records.append(record)

            return Response({
                "success": True,
                "records": fixed_records,
                "count": len(fixed_records),
            })

        except Exception as e:
            print("GET ATTENDANCE ERROR:", e)

            return Response({
                "success": False,
                "error": str(e),
                "records": [],
                "count": 0,
            }, status=500)

class AdminStatsView(APIView):
    def get(self, request):
        try:
            students = get_all_students()
            records = get_sheet("Attendance").get_all_records()

            subjects = sorted(list(set(
                str(r.get("Subject", "")).strip()
                for r in records
                if str(r.get("Subject", "")).strip()
            )))

            stats = []

            for student in students:
                roll = str(student.get("Roll No", "")).strip()

                student_records = [
                    r for r in records
                    if str(r.get("Roll No", "")).strip() == roll
                ]

                subject_data = {}

                for subject in subjects:
                    count = len([
                        r for r in student_records
                        if str(r.get("Subject", "")).strip().lower() == subject.lower()
                    ])

                    total_classes = len([
                        r for r in records
                        if str(r.get("Subject", "")).strip().lower() == subject.lower()
                        and str(r.get("Semester", "")).strip() == str(student.get("Semester", "")).strip()
                    ])

                    percentage = round((count / total_classes) * 100) if total_classes > 0 else 0

                    subject_data[subject] = {
                        "count": count,
                        "total": total_classes,
                        "percentage": percentage,
                    }

                stats.append({
                    "name": student.get("Name", ""),
                    "roll_no": student.get("Roll No", ""),
                    "email": student.get("Email", ""),
                    "branch": student.get("Branch", ""),
                    "year": student.get("Year", ""),
                    "semester": student.get("Semester", ""),
                    "subjects": subject_data,
                })

            return Response({
                "success": True,
                "stats": stats,
                "subjects": subjects,
            })

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)


class ExportAttendanceCSVView(APIView):
    def get(self, request):
        try:
            semester = request.query_params.get("semester", "").strip()
            subject = request.query_params.get("subject", "").strip().lower()

            records = get_sheet("Attendance").get_all_records()

            if semester:
                records = [
                    r for r in records
                    if str(r.get("Semester", "")).strip() == semester
                ]

            if subject:
                records = [
                    r for r in records
                    if str(r.get("Subject", "")).strip().lower() == subject
                ]

            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="attendance_export.csv"'

            writer = csv.writer(response)
            writer.writerow(["Name", "Roll No", "Date", "Time", "Subject", "Semester"])

            for r in records:
                writer.writerow([
                    r.get("Name", ""),
                    r.get("Roll No", ""),
                    r.get("Date", ""),
                    r.get("Time", ""),
                    r.get("Subject", ""),
                    r.get("Semester", ""),
                ])

            return response

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class NoticeView(APIView):
    def get(self, request):
        try:
            sheet = get_sheet("Notices")
            rows = sheet.get_all_records()

            notices = []
            for i, r in enumerate(rows, start=2):
                notices.append({
                    "row": i,
                    "title": r.get("Title", ""),
                    "date": r.get("Date", ""),
                    "text": r.get("Text", ""),
                })

            return Response({
                "success": True,
                "notices": notices,
            })

        except Exception as e:
            return Response({
                "success": False,
                "error": str(e),
                "notices": [],
            }, status=500)

    def post(self, request):
        try:
            title = request.data.get("title", "").strip()
            date = request.data.get("date", "").strip()
            text = request.data.get("text", "").strip()

            if not title or not date or not text:
                return Response({"error": "Title, date and text required"}, status=400)

            sheet = get_sheet("Notices")
            sheet.append_row([title, date, text])

            return Response({
                "success": True,
                "message": "Notice added successfully",
            })

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)


class DeleteNoticeView(APIView):
    def delete(self, request, row):
        try:
            sheet = get_sheet("Notices")
            sheet.delete_rows(row)

            return Response({
                "success": True,
                "message": "Notice deleted successfully",
            })

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)