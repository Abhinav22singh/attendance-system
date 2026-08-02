from rest_framework.views import APIView
from rest_framework.response import Response
from students.sheets import get_all_students, get_sheet
from collections import defaultdict

class AttendanceStatsView(APIView):
    def get(self, request):
        try:
            students = get_all_students()
            records = get_sheet('Attendance').get_all_records()

            # Build stats per student per subject
            # Format: {roll_no: {subject: count}}
            attendance_map = defaultdict(lambda: defaultdict(int))
            for r in records:
                roll = str(r.get('Roll No', ''))
                subject = str(r.get('Subject', ''))
                if roll and subject:
                    attendance_map[roll][subject] += 1

            # Get all unique subjects
            all_subjects = list(set(r.get('Subject', '') for r in records if r.get('Subject')))

            # Build result
            result = []
            for s in students:
                roll = str(s.get('Roll No', ''))
                student_stats = {
                    'name': s.get('Name', ''),
                    'roll_no': roll,
                    'branch': s.get('Branch', ''),
                    'semester': s.get('Semester', ''),
                    'subjects': {}
                }
                for subject in all_subjects:
                    count = attendance_map[roll][subject]
                    student_stats['subjects'][subject] = count

                result.append(student_stats)

            return Response({
                'stats': result,
                'subjects': all_subjects,
                'total_students': len(result)
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)