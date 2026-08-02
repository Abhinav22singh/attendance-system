from django.urls import path

from students.views import (
    RegisterStudentView,
    GetStudentsView,
    StudentLoginView,
    NoticesView,
)

from attendance.views import (
    MarkAttendanceView,
    GetAttendanceView,
)

from attendance.stats_views import AttendanceStatsView

from attendance.teacher_views import (
    TeacherLoginView,
    GenerateQRView,
    MarkAttendanceQRView,
    TeacherRecordsView,
)

from core.admin_views import (
    AdminLoginView,
    AdminVerifyView,
)

urlpatterns = [

    # ================= STUDENT =================

    path('api/register/', RegisterStudentView.as_view()),
    path('api/students/', GetStudentsView.as_view()),
    path('api/student-login/', StudentLoginView.as_view()),
    path('api/notices/', NoticesView.as_view()),

    # ================= ATTENDANCE =================

    path('api/mark-attendance/', MarkAttendanceView.as_view()),
    path('api/attendance/', GetAttendanceView.as_view()),
    path('api/stats/', AttendanceStatsView.as_view()),

    # ================= TEACHER =================

    path('api/teacher/login/', TeacherLoginView.as_view()),
    path('api/teacher/generate-qr/', GenerateQRView.as_view()),
    path('api/teacher/mark-attendance/', MarkAttendanceQRView.as_view()),
    path('api/teacher/records/', TeacherRecordsView.as_view()),

    # ================= ADMIN =================

    path('api/admin/login/', AdminLoginView.as_view()),
    path('api/admin/verify/', AdminVerifyView.as_view()),
]