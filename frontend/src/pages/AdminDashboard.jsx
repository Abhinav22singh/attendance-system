import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../config/api";

export default function AdminDashboard({ onLogout }) {
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [reportSemester, setReportSemester] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    date: "",
    text: "",
  });

  const getValue = (obj, keys) => {
    for (let key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        return obj[key];
      }
    }
    return "";
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stats/`);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);

    try {
      const params = {};

      if (reportSemester) params.semester = reportSemester;
      if (filterSubject) params.subject = filterSubject;

      const res = await axios.get(`${API_BASE_URL}/api/attendance/`, {
        params,
      });

      setRecords(res.data.records || []);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const fetchNotices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notices/`);
      setNotices(res.data.notices || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecords();
    fetchNotices();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [reportSemester, filterSubject]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    onLogout();
  };

  const downloadExcel = () => {
    const excelData = filteredRecords.map((r) => ({
      Name: getValue(r, ["Name", "name"]),
      "Roll No": getValue(r, ["Roll No", "roll_no", "rollNo"]),
      Semester: getValue(r, ["Semester", "semester"]),
      Subject: getValue(r, ["Subject", "subject"]),
      Date: getValue(r, ["Date", "date"]),
      Time: getValue(r, ["Time", "time"]),
    }));

    if (excelData.length === 0) {
      alert("No records to download");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    XLSX.writeFile(
      workbook,
      `attendance_report_semester_${reportSemester || "all"}.xlsx`
    );
  };

  const printRecords = () => {
    window.print();
  };

  const addNotice = async () => {
    if (!noticeForm.title || !noticeForm.date || !noticeForm.text) {
      return alert("Fill all notice fields");
    }

    try {
      await axios.post(`${API_BASE_URL}/api/notices/`, noticeForm);

      setNoticeForm({
        title: "",
        date: "",
        text: "",
      });

      fetchNotices();
      alert("Notice added successfully");
    } catch (err) {
      console.log(err);
      alert("Failed to add notice");
    }
  };

  const deleteNotice = async (row) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notices/${row}/delete/`);
      fetchNotices();
    } catch (err) {
      console.log(err);
      alert("Failed to delete notice");
    }
  };

  const filteredRecords = records.filter((r) => {
    const name = getValue(r, ["Name", "name"]).toLowerCase();
    const roll = String(getValue(r, ["Roll No", "roll_no", "rollNo"]));
    const keyword = search.toLowerCase();

    return name.includes(keyword) || roll.includes(search);
  });

  const semesterWiseRecords = filteredRecords.reduce((acc, record) => {
    const sem = getValue(record, ["Semester", "semester"]) || "Not Added";

    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(record);

    return acc;
  }, {});

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={title}>🛡️ ADMIN DASHBOARD</h2>
          <p style={subtitle}>SVIST ATTENDANCE MANAGEMENT</p>
        </div>

        <button onClick={handleLogout} style={btnBrown}>
          🚪 LOGOUT
        </button>
      </div>

      {/* <div style={filterBox}>
        <input
          type="text"
          placeholder="🔍 Search Name / Roll No..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          style={select}
        >
          <option value="">ALL SUBJECTS</option>

          {subjects.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button onClick={fetchRecords} style={btnGreen}>
          🔄 REFRESH
        </button>
      </div> */}

      <div style={card}>
        <div style={reportHeader}>
          <div>
            <h3 style={cardTitle}>📋 Attendance Report</h3>
            <p style={cardText}>View and download semester-wise attendance.</p>
          </div>

          <div style={reportActions}>
            <select
              value={reportSemester}
              onChange={(e) => setReportSemester(e.target.value)}
              style={select}
            >
              <option value="">ALL SEMESTERS</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  SEMESTER {s}
                </option>
              ))}
            </select>

            <button onClick={downloadExcel} style={btnExcel}>
              📥 DOWNLOAD EXCEL
            </button>

            <button onClick={printRecords} style={btnBrown}>
              🖨️ PRINT
            </button>
          </div>
        </div>

        {loading ? (
          <div style={emptyBox}>Loading records...</div>
        ) : Object.keys(semesterWiseRecords).length === 0 ? (
          <div style={emptyBox}>No attendance records found.</div>
        ) : (
          Object.entries(semesterWiseRecords).map(([semester, semRecords]) => (
            <div key={semester} style={{ marginBottom: "35px" }}>
              <h3 style={semTitle}>🎓 Semester {semester}</h3>

              <div style={{ overflowX: "auto" }}>
                <table style={table}>
                  <thead>
                    <tr>
                      {["DATE", "TIME", "SUBJECT", "NAME", "ROLL NO"].map(
                        (h) => (
                          <th key={h} style={tableHead}>
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {semRecords.map((r, i) => (
                      <tr key={i}>
                        <td style={tableCell}>{getValue(r, ["Date", "date"])}</td>
                        <td style={tableCell}>{getValue(r, ["Time", "time"])}</td>
                        <td style={tableCell}>
                          {getValue(r, ["Subject", "subject"])}
                        </td>
                        <td style={tableCell}>{getValue(r, ["Name", "name"])}</td>
                        <td style={tableCell}>
                          {getValue(r, ["Roll No", "roll_no", "rollNo"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={card}>
        <h3 style={cardTitle}>📌 Manage Notice Board</h3>

        <div style={noticeFormBox}>
          <input
            type="text"
            placeholder="Notice Title"
            value={noticeForm.title}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, title: e.target.value })
            }
            style={input}
          />

          <input
            type="text"
            placeholder="Notice Date"
            value={noticeForm.date}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, date: e.target.value })
            }
            style={input}
          />

          <textarea
            rows={4}
            placeholder="Notice Text"
            value={noticeForm.text}
            onChange={(e) =>
              setNoticeForm({ ...noticeForm, text: e.target.value })
            }
            style={input}
          />

          <button onClick={addNotice} style={btnGreen}>
            ➕ ADD NOTICE
          </button>
        </div>

        <div style={{ marginTop: "24px" }}>
          {notices.map((n, i) => (
            <div key={i} style={noticeCard}>
              <p style={noticeTitle}>{n.title}</p>
              <p style={noticeDate}>{n.date}</p>
              <p style={noticeText}>{n.text}</p>

              <button onClick={() => deleteNotice(n.row)} style={btnDelete}>
                ❌ DELETE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  padding: "24px",
  fontFamily: "'Courier New', monospace",
  background: "#0f0f0f",
  color: "#fefae0",
};

const header = {
  background: "#1a0a00",
  border: "3px solid #FAC775",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  boxShadow: "6px 6px 0 #000",
};

const title = {
  color: "#FAC775",
  fontSize: "26px",
  fontWeight: 900,
  margin: 0,
  textShadow: "3px 3px 0 #000",
};

const subtitle = {
  color: "#d6c2a3",
  fontSize: "12px",
  marginTop: "6px",
  fontWeight: 700,
};

const filterBox = {
  background: "#1b4332",
  border: "3px solid #b08968",
  borderRadius: "14px",
  padding: "18px",
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
  boxShadow: "5px 5px 0 #081c15",
};

const card = {
  background: "#1b4332",
  border: "4px solid #b08968",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "34px",
  boxShadow: "8px 8px 0 #081c15",
};

const reportHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: "22px",
};

const reportActions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const cardTitle = {
  color: "#FAC775",
  margin: 0,
  fontSize: "22px",
  textShadow: "2px 2px 0 #081c15",
};

const cardText = {
  color: "#fefae0",
  fontSize: "13px",
  marginTop: "6px",
};

const input = {
  flex: 1,
  minWidth: "220px",
  padding: "12px 14px",
  border: "3px solid #FAC775",
  borderRadius: "10px",
  fontFamily: "'Courier New', monospace",
  background: "#fefae0",
  color: "#123524",
  outline: "none",
  fontWeight: 700,
};

const select = {
  minWidth: "190px",
  padding: "12px 14px",
  border: "3px solid #FAC775",
  borderRadius: "10px",
  fontFamily: "'Courier New', monospace",
  background: "#fefae0",
  color: "#123524",
  outline: "none",
  fontWeight: 700,
};

const btnGreen = {
  padding: "12px 18px",
  fontWeight: 900,
  background: "#95d5b2",
  color: "#081c15",
  border: "3px solid #081c15",
  borderRadius: "10px",
  cursor: "pointer",
  boxShadow: "3px 3px 0 #000",
};

const btnBrown = {
  padding: "12px 18px",
  fontWeight: 900,
  background: "#FAC775",
  color: "#1a0a00",
  border: "3px solid #1a0a00",
  borderRadius: "10px",
  cursor: "pointer",
  boxShadow: "3px 3px 0 #000",
};

const btnExcel = {
  padding: "12px 18px",
  fontWeight: 900,
  background: "#d8f3dc",
  color: "#081c15",
  border: "3px solid #081c15",
  borderRadius: "10px",
  cursor: "pointer",
  boxShadow: "3px 3px 0 #000",
};

const btnDelete = {
  padding: "8px 14px",
  background: "#ffe0e0",
  color: "#cc0044",
  border: "2px solid #cc0044",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 900,
};

const semTitle = {
  background: "#fefae0",
  color: "#1b4332",
  padding: "12px",
  border: "3px solid #FAC775",
  borderRadius: "10px",
  marginBottom: "12px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fefae0",
  color: "#123524",
  borderRadius: "10px",
  overflow: "hidden",
};

const tableHead = {
  padding: "14px",
  border: "2px solid #123524",
  textAlign: "left",
  fontSize: "12px",
  background: "#d8f3dc",
  color: "#081c15",
};

const tableCell = {
  padding: "13px",
  border: "1px solid #b08968",
  fontSize: "13px",
  fontWeight: 700,
};

const emptyBox = {
  background: "#fefae0",
  color: "#123524",
  padding: "30px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: 900,
};

const noticeFormBox = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "18px",
};

const noticeCard = {
  background: "#fefae0",
  color: "#123524",
  border: "3px solid #FAC775",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
};

const noticeTitle = {
  margin: 0,
  fontWeight: 900,
  color: "#1b4332",
};

const noticeDate = {
  margin: "4px 0",
  fontSize: "12px",
  color: "#7a4f00",
  fontWeight: 700,
};

const noticeText = {
  color: "#123524",
  fontWeight: 700,
};