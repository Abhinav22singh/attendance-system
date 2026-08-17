import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Records() {
  const [records, setRecords] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});
  const [overallStats, setOverallStats] = useState({
    attended: 0,
    total: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const CLASSES_PER_WEEK = 4;
  const WEEKS_PER_MONTH = 4;
  const MONTHLY_TOTAL_CLASSES = CLASSES_PER_WEEK * WEEKS_PER_MONTH;

  const SEMESTER_SUBJECTS = {
    1: ["PHYSICS-I", "MATHEMATICS-I", "BASIC ELECTRICAL ENGINEERING", "ENGINEERING GRAPHICS & DESIGN"],
    2: ["CHEMISTRY-I", "MATHEMATICS-II", "PROGRAMMING FOR PROBLEM SOLVING", "ENGLISH"],
    3: ["ANALOG & DIGITAL ELECTRONICS", "DATA STRUCTURE & ALGORITHMS", "COMPUTER ORGANIZATION", "MATHEMATICS-III", "ECONOMICS FOR ENGINEERS"],
    4: ["DISCRETE MATHEMATICS", "COMPUTER ARCHITECTURE", "FORMAL LANGUAGE & AUTOMATA THEORY", "DESIGN & ANALYSIS OF ALGORITHMS", "BIOLOGY", "ENVIRONMENTAL SCIENCE"],
    5: ["SOFTWARE ENGINEERING", "COMPILER DESIGN", "OPERATING SYSTEMS", "OBJECT ORIENTED PROGRAMMING", "CONSTITUTION OF INDIA"],
    6: ["DATABASE MANAGEMENT SYSTEMS", "COMPUTER NETWORKS", "PROFESSIONAL ELECTIVE", "OPEN ELECTIVE"],
    7: ["ARTIFICIAL INTELLIGENCE", "MACHINE LEARNING", "CLOUD COMPUTING", "PROFESSIONAL ELECTIVE", "OPEN ELECTIVE", "PROJECT PHASE-I", "INDUSTRIAL TRAINING"],
    8: ["CRYPTOGRAPHY & NETWORK SECURITY", "PROFESSIONAL ELECTIVE", "CAPSTONE PROJECT", "GRAND VIVA"],
  };

  useEffect(() => {
    fetchMyRecords();
  }, []);

  const getValue = (obj, keys) => {
    for (let key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        return obj[key];
      }
    }
    return "";
  };

  const normalizeSubject = (subject) => {
    let s = String(subject || "").trim().toUpperCase();

    if (s === "DBMS" || s.includes("DATABASE")) return "DATABASE MANAGEMENT SYSTEMS";
    if (s === "CN" || s.includes("COMPUTER NETWORK")) return "COMPUTER NETWORKS";
    if (s === "DSA" || s.includes("DATA STRUCTURE")) return "DATA STRUCTURE & ALGORITHMS";
    if (s === "OS" || s.includes("OPERATING SYSTEM")) return "OPERATING SYSTEMS";
    if (s.includes("DESIGN") && s.includes("ALGORITHM")) return "DESIGN & ANALYSIS OF ALGORITHMS";
    if (s.includes("COMPUTER ORGANISATION")) return "COMPUTER ORGANIZATION";
    if (s.includes("OOP")) return "OBJECT ORIENTED PROGRAMMING";
    if (s === "AI") return "ARTIFICIAL INTELLIGENCE";

    return s || "GENERAL";
  };

  const applyRecords = (formattedRecords, studentSemester) => {
    setRecords(formattedRecords);

    const semesterSubjects = SEMESTER_SUBJECTS[studentSemester] || [];
    const stats = {};

    semesterSubjects.forEach((subject) => {
      stats[subject] = {
        attended: 0,
        total: MONTHLY_TOTAL_CLASSES,
        percentage: 0,
      };
    });

    formattedRecords.forEach((r) => {
      const subject = normalizeSubject(r.subject);

      if (!stats[subject]) {
        stats[subject] = {
          attended: 0,
          total: MONTHLY_TOTAL_CLASSES,
          percentage: 0,
        };
      }

      stats[subject].attended += 1;
    });

    Object.keys(stats).forEach((subject) => {
      stats[subject].percentage = Math.min(
        Math.round((stats[subject].attended / stats[subject].total) * 100),
        100
      );
    });

    const totalAttended = Object.values(stats).reduce(
      (sum, item) => sum + item.attended,
      0
    );

    const totalClasses = Object.values(stats).reduce(
      (sum, item) => sum + item.total,
      0
    );

    setSubjectStats(stats);
    setOverallStats({
      attended: totalAttended,
      total: totalClasses,
      percentage:
        totalClasses > 0
          ? Math.min(Math.round((totalAttended / totalClasses) * 100), 100)
          : 0,
    });
  };

  const fetchMyRecords = async () => {
    setLoading(true);
    setMessage("");

    const loggedStudent = JSON.parse(localStorage.getItem("loggedStudent"));

    if (!loggedStudent) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    const loggedRoll = String(
      loggedStudent.roll_no ||
        loggedStudent["Roll No"] ||
        loggedStudent.rollNo ||
        ""
    )
      .trim()
      .toLowerCase();

    const studentSemester = Number(
      loggedStudent.semester ||
        loggedStudent.Semester ||
        loggedStudent.sem ||
        loggedStudent.Sem ||
        0
    );

    const cacheKey = `attendance_records_${loggedRoll}_sem_${studentSemester}`;

    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      applyRecords(JSON.parse(cached), studentSemester);
      setLoading(false);
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/`);
      const all = res.data.records || [];

      const mine = all.filter((r) => {
        const recordRoll = String(
          getValue(r, ["Roll No", "roll_no", "rollNo", "Roll", "roll"])
        )
          .trim()
          .toLowerCase();

        const recordSemester = Number(
          getValue(r, ["Semester", "semester", "Sem", "sem"])
        );

        return recordRoll === loggedRoll && recordSemester === studentSemester;
      });

      const formatted = mine.map((r) => ({
        name: getValue(r, ["Name", "name"]),
        roll_no: getValue(r, ["Roll No", "roll_no", "rollNo", "Roll", "roll"]),
        subject: normalizeSubject(getValue(r, ["Subject", "subject"])),
        semester: getValue(r, ["Semester", "semester"]),
        date: getValue(r, ["Date", "date"]),
        time: getValue(r, ["Time", "time"]),
      }));

      localStorage.setItem(cacheKey, JSON.stringify(formatted));
      applyRecords(formatted, studentSemester);
    } catch (err) {
      console.log(err);

      if (!cached) {
        setMessage("Failed to fetch records.");
      }
    }

    setLoading(false);
  };

  const clearMyCache = () => {
    const loggedStudent = JSON.parse(localStorage.getItem("loggedStudent"));
    if (!loggedStudent) return;

    const roll = String(loggedStudent.roll_no || "").trim().toLowerCase();
    const sem = Number(loggedStudent.semester || 0);

    localStorage.removeItem(`attendance_records_${roll}_sem_${sem}`);
    fetchMyRecords();
  };

  const getColor = (pct) => {
    if (pct < 50) return "#ff3366";
    if (pct < 75) return "#ffaa00";
    return "#00aa66";
  };

  const getBg = (pct) => {
    if (pct < 50) return "#ffe0e8";
    if (pct < 75) return "#fff5d6";
    return "#dfffea";
  };

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        style={{
          background: "#1b4332",
          border: "10px solid #b08968",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 10px 0 #081c15",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <h2
            style={{
              color: "#fefae0",
              fontSize: "30px",
              margin: 0,
              textTransform: "uppercase",
              textShadow: "3px 3px 0 #081c15",
            }}
          >
            📋 My Attendance Records
          </h2>

          <button onClick={clearMyCache} style={btnStyle}>
            🔄 Refresh
          </button>
        </div>

        {loading && records.length === 0 && (
          <div style={emptyBox}>⏳ Loading your attendance records...</div>
        )}

        {!loading && message && (
          <div
            style={{
              ...emptyBox,
              background: "#ffe0e0",
              color: "#cc0044",
            }}
          >
            {message}
          </div>
        )}

        {!message && overallStats.total > 0 && (
          <div
            style={{
              background: "#fefae0",
              border: `4px solid ${getColor(overallStats.percentage)}`,
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "30px",
              boxShadow: `6px 6px 0 ${getColor(overallStats.percentage)}`,
              color: "#123524",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: "24px" }}>
              🎓 Overall Monthly Attendance
            </h3>

            <h1
              style={{
                margin: "0 0 16px",
                fontSize: "42px",
                color: getColor(overallStats.percentage),
              }}
            >
              {overallStats.percentage}%
            </h1>

            <p style={{ margin: 0, fontWeight: 800, fontSize: "15px" }}>
              Total Classes Attended: {overallStats.attended} /{" "}
              {overallStats.total}
            </p>
          </div>
        )}

        {!message && Object.keys(subjectStats).length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
              marginBottom: "34px",
            }}
          >
            {Object.entries(subjectStats).map(([subject, data], i) => (
              <div
                key={i}
                style={{
                  background: getBg(data.percentage),
                  border: `3px solid ${getColor(data.percentage)}`,
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: `5px 5px 0 ${getColor(data.percentage)}`,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px",
                    color: "#123524",
                    fontSize: "18px",
                    textTransform: "uppercase",
                  }}
                >
                  📚 {subject}
                </h3>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#123524",
                    marginBottom: "12px",
                  }}
                >
                  Attendance: {data.percentage}%
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "14px",
                    background: "#eee",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${data.percentage}%`,
                      height: "100%",
                      background: getColor(data.percentage),
                    }}
                  />
                </div>

                <p
                  style={{
                    marginTop: "14px",
                    color: "#123524",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  Classes Attended: {data.attended} / {data.total}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !message && records.length === 0 ? (
          <div style={emptyBox}>No attendance marked yet.</div>
        ) : (
          !message &&
          records.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#fefae0",
                  color: "#123524",
                }}
              >
                <thead>
                  <tr style={{ background: "#d8f3dc" }}>
                    {["SUBJECT", "SEMESTER", "DATE", "TIME"].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{r.subject}</td>
                      <td style={tdStyle}>Semester {r.semester}</td>
                      <td style={tdStyle}>{r.date}</td>
                      <td style={tdStyle}>{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const emptyBox = {
  background: "#fefae0",
  color: "#123524",
  padding: "40px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: 800,
  boxShadow: "5px 5px 0 #081c15",
};

const thStyle = {
  padding: "14px",
  border: "2px solid #123524",
  textAlign: "left",
  fontSize: "12px",
};

const tdStyle = {
  padding: "14px",
  border: "2px solid #123524",
  fontWeight: 700,
};

const btnStyle = {
  padding: "12px 18px",
  background: "#d8f3dc",
  color: "#123524",
  border: "2px dashed #95d5b2",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 900,
  fontFamily: "'Courier New', monospace",
};