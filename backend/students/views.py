import face_recognition
import numpy as np
import base64
import json
from datetime import datetime
from PIL import Image
from io import BytesIO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .sheets import add_student, get_all_students


class RegisterStudentView(APIView):
    def post(self, request):
        data = request.data
        name = data.get('name')
        roll_no = data.get('roll_no')
        email = data.get('email')
        branch = data.get('branch')
        year = data.get('year')
        semester = data.get('semester')
        image_b64 = data.get('image')

        if not all([name, roll_no, email, branch, year, semester, image_b64]):
            return Response({'error': 'All fields required'}, status=400)

        # Check duplicate
        students = get_all_students()
        if any(str(s['Roll No']).strip().lower() == str(roll_no).strip().lower() for s in students):
            return Response({'error': 'Student already registered with this roll number'}, status=400)

        # Face encoding
        try:
            img_data = base64.b64decode(image_b64.split(',')[1])
            img = Image.open(BytesIO(img_data)).convert('RGB')
            img_array = np.array(img)

            encodings = face_recognition.face_encodings(img_array)
            if not encodings:
                return Response({'error': 'No face detected. Please try again in good lighting.'}, status=400)

            encoding_str = json.dumps(encodings[0].tolist())
        except Exception as e:
            return Response({'error': str(e)}, status=500)

        add_student({
            'name': name,
            'roll_no': roll_no,
            'email': email,
            'branch': branch,
            'year': year,
            'semester': semester,
            'face_encoding': encoding_str
        })

        return Response({'message': f'{name} registered successfully!'})


class GetStudentsView(APIView):
    def get(self, request):
        try:
            students = get_all_students()
            safe = [{k: v for k, v in s.items() if k != 'Face Encoding'} for s in students]
            return Response({'students': safe, 'count': len(safe)})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class StudentLoginView(APIView):
    def post(self, request):
        roll_no = request.data.get('roll_no', '').strip()
        name = request.data.get('name', '').strip()

        if not roll_no or not name:
            return Response({'error': 'Roll number and name required'}, status=400)

        try:
            students = get_all_students()
            student = next(
                (s for s in students
                 if str(s['Roll No']).strip().lower() == roll_no.lower()
                 and str(s['Name']).strip().lower() == name.lower()),
                None
            )

            if not student:
                return Response({'error': 'Student not found. Check your name and roll number.'}, status=404)

            return Response({
                'message': 'Login successful',
                'student': {
                    'name': student['Name'],
                    'roll_no': student['Roll No'],
                    'branch': student['Branch'],
                    'semester': student['Semester'],
                    'year': student['Year'],
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class NoticesView(APIView):
    def get(self, request):
        notices = [
            {
                "title": "Semester Internal Examination",
                "date": "12 June 2026",
                "text": "All students are informed that internal examinations will begin from 20th June."
            },
            {
                "title": "Attendance Requirement",
                "date": "15 June 2026",
                "text": "Students must maintain minimum 75% attendance to appear in semester examinations."
            },
            {
                "title": "AI Workshop Registration",
                "date": "18 June 2026",
                "text": "Registration is open for the AI and Machine Learning workshop in the seminar hall."
            },
            {
                "title": "Project Submission",
                "date": "22 June 2026",
                "text": "Final year project report submission deadline is extended till 30th June."
            },
            {
                "title": "Library Notice",
                "date": "25 June 2026",
                "text": "Library will remain open till 7:00 PM during examination preparation week."
            },
        ]
        return Response({'notices': notices})