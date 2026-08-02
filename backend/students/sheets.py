import gspread
from google.oauth2.service_account import Credentials
from django.conf import settings

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def get_sheet(tab_name):
    creds = Credentials.from_service_account_file(
        str(settings.GOOGLE_SHEETS_CREDENTIALS),
        scopes=SCOPES,
    )

    client = gspread.authorize(creds)
    spreadsheet = client.open(settings.GOOGLE_SHEET_NAME)

    return spreadsheet.worksheet(tab_name)


# ================= STUDENTS =================

def get_all_students():
    return get_sheet("Students").get_all_records()


def add_student(data: dict):
    sheet = get_sheet("Students")

    sheet.append_row(
        [
            str(data.get("name", "")),
            str(data.get("roll_no", "")),
            str(data.get("email", "")),
            str(data.get("branch", "")),
            str(data.get("year", "")),
            str(data.get("semester", "")),
            str(data.get("face_encoding", "")),
        ],
        value_input_option="RAW",
    )


# ================= TEACHERS =================

def get_all_teachers():
    return get_sheet("Teachers").get_all_records()


# ================= QR TOKENS =================

def get_all_tokens():
    return get_sheet("QR_Tokens").get_all_records()


def add_qr_token(data: dict):
    sheet = get_sheet("QR_Tokens")

    sheet.append_row(
        [
            str(data.get("token", "")),
            str(data.get("teacher_id", "")),
            str(data.get("subject", "")),
            str(data.get("semester", "")),
            str(data.get("created_at", "")),
            str(data.get("expires_at", "")),
            "No",
        ],
        value_input_option="RAW",
    )


def mark_token_used(token: str):
    sheet = get_sheet("QR_Tokens")
    records = sheet.get_all_records()

    for i, row in enumerate(records):
        if str(row.get("Token", "")).strip() == str(token).strip():
            sheet.update_cell(i + 2, 7, "Yes")
            break


# ================= ATTENDANCE =================

def get_all_attendance():
    return get_sheet("Attendance").get_all_records()


def add_attendance(data: dict):
    sheet = get_sheet("Attendance")

    sheet.append_row(
        [
            str(data.get("name", "")),
            str(data.get("roll_no", "")),
            str(data.get("date", "")),
            str(data.get("time", "")),
            str(data.get("subject", "")),
            str(data.get("semester", "")),
            str(data.get("teacher_id", "")),
            str(data.get("token", "")),
            str(data.get("latitude", "")),
            str(data.get("longitude", "")),
            str(data.get("distance", "")),
        ],
        value_input_option="RAW",
    )


# ================= NOTICES =================

def get_all_notices():
    try:
        return get_sheet("Notices").get_all_records()
    except Exception:
        return []


def add_notice(data: dict):
    sheet = get_sheet("Notices")

    sheet.append_row(
        [
            str(data.get("title", "")),
            str(data.get("date", "")),
            str(data.get("text", "")),
        ],
        value_input_option="RAW",
    )


def delete_notice(row: int):
    sheet = get_sheet("Notices")
    sheet.delete_rows(int(row))


# ================= CLEAR HELPERS OPTIONAL =================

def clear_attendance_sheet():
    sheet = get_sheet("Attendance")
    sheet.clear()
    sheet.append_row(
        [
            "Name",
            "Roll No",
            "Date",
            "Time",
            "Subject",
            "Semester",
            "Teacher ID",
            "Token",
            "Latitude",
            "Longitude",
            "Distance",
        ],
        value_input_option="RAW",
    )


def clear_qr_tokens_sheet():
    sheet = get_sheet("QR_Tokens")
    sheet.clear()
    sheet.append_row(
        [
            "Token",
            "Teacher ID",
            "Subject",
            "Semester",
            "Created At",
            "Expires At",
            "Used",
        ],
        value_input_option="RAW",
    )