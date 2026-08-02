import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import QRCode from "qrcode";

export default function TeacherDashboard({ teacher, onLogout }) {
  const [subject, setSubject] = useState(teacher?.subjects?.[0] || "");
  const [semester, setSemester] = useState(String(teacher?.semester || ""));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchRecords();
    return () => timerRef.current && clearInterval(timerRef.current);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSubject = subject
        ? String(r["Subject"] || "").trim().toLowerCase() === subject.toLowerCase()
        : true;

      const matchSemester = semester
        ? String(r["Semester"] || "").trim() === String(semester)
        : true;

      const matchMonth = month
        ? String(r["Date"] || "").startsWith(month)
        : true;

      return matchSubject && matchSemester && matchMonth;
    });
  }, [records, subject, semester, month]);

  const fetchRecords = async () => {
    setLoadingRecords(true);

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/teacher/records/", {
        params: { teacher_id: teacher.teacher_id },
      });

      setRecords(res.data.records || []);
    } catch (err) {
      console.log("TEACHER RECORDS ERROR:", err.response?.data || err);
      setRecords([]);
    }

    setLoadingRecords(false);
  };

  const generateQR = async () => {
    if (!subject || !semester) {
      return setMessage({
        type: "error",
        text: "Please select subject and semester.",
      });
    }

    setLoadingQR(true);
    setMessage(null);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/teacher/generate-qr/",
        {
          teacher_id: teacher.teacher_id,
          subject,
          semester,
        }
      );

      const qrImg = await QRCode.toDataURL(res.data.qr_data, {
        width: 300,
        margin: 2,
        color: {
          dark: "#123524",
          light: "#fefae0",
        },
      });

      setQrData(res.data);
      setQrImage(qrImg);

      let seconds = 15 * 60;
      setTimeLeft(seconds);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        seconds -= 1;
        setTimeLeft(seconds);

        if (seconds <= 0) {
          clearInterval(timerRef.current);
          setQrData(null);
          setQrImage("");
          setMessage({
            type: "error",
            text: "QR expired. Generate a new QR.",
          });
        }
      }, 1000);

      setMessage({
        type: "success",
        text: "✅ QR generated successfully.",
      });
    } catch (err) {
      console.log("QR GENERATE ERROR:", err.response?.data || err);

      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to generate QR.",
      });
    }

    setLoadingQR(false);
  };

  const downloadCSV = () => {
    if (!filteredRecords.length) return;

    const headers = [
      "Name",
      "Roll No",
      "Date",
      "Time",
      "Subject",
      "Semester",
      "Teacher ID",
      "Latitude",
      "Longitude",
      "Distance",
    ];

    const rows = filteredRecords.map((r) => [
      r["Name"] || "",
      r["Roll No"] || "",
      r["Date"] || "",
      r["Time"] || "",
      r["Subject"] || "",
      r["Semester"] || "",
      r["Teacher ID"] || "",
      r["Latitude"] || "",
      r["Longitude"] || "",
      r["Distance"] || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${teacher.teacher_id}_${subject || "all"}_sem_${semester || "all"}_${month || "all"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>👨‍🏫 Teacher Dashboard</h2>
            <p style={subText}>
              {teacher.name} | ID: {teacher.teacher_id} | SEM {teacher.semester}
            </p>
            <p style={miniText}>Subjects: {teacher.subjects.join(", ")}</p>
          </div>

          <button onClick={onLogout} style={dangerBtn}>
            🚪 Logout
          </button>
        </div>

        {message && (
          <div
            style={{
              ...alertStyle,
              background: message.type === "success" ? "#0a2e1a" : "#3d0000",
              color: message.type === "success" ? "#6EE7B7" : "#ff6b6b",
              border: `2px dashed ${
                message.type === "success" ? "#6EE7B7" : "#ff3366"
              }`,
            }}
          >
            {message.text}
          </div>
        )}

        <div style={sectionBox}>
          <h3 style={sectionTitle}>📱 Generate Class QR</h3>

          <div style={controlRow}>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
              {teacher.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select value={semester} onChange={(e) => setSemester(e.target.value)} style={inputStyle}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <button
              onClick={generateQR}
              disabled={loadingQR}
              style={{ ...primaryBtn, opacity: loadingQR ? 0.6 : 1 }}
            >
              {loadingQR ? "Generating..." : "⚡ Generate QR"}
            </button>
          </div>

          {qrImage && qrData && (
            <div style={{ marginTop: "22px" }}>
              <div style={qrBox}>
                <img src={qrImage} alt="QR Code" style={{ width: "260px", maxWidth: "100%" }} />
              </div>

              <p style={{ color: "#6EE7B7", fontWeight: 900 }}>
                {qrData.subject} | SEM {qrData.semester}
              </p>

              <p style={{ color: timeLeft <= 60 ? "#ff6b6b" : "#fefae0", fontWeight: 900 }}>
                ⏱ {formatTime(timeLeft)}
              </p>

              <p style={miniText}>Expires: {qrData.expires_at}</p>
            </div>
          )}
        </div>

        <div style={sectionBox}>
          <div style={recordsHeader}>
            <div>
              <h3 style={sectionTitle}>📋 Attendance Records</h3>
              <p style={miniText}>
                Showing {filteredRecords.length} of {records.length} records
              </p>
            </div>

            <div style={buttonGroup}>
              <button onClick={fetchRecords} style={primaryBtn}>🔄 Refresh</button>
              <button onClick={downloadCSV} style={primaryBtn}>⬇ CSV</button>
            </div>
          </div>

          <div style={controlRow}>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
              <option value="">All Subjects</option>
              {teacher.subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select value={semester} onChange={(e) => setSemester(e.target.value)} style={inputStyle}>
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={inputStyle}
            />
          </div>

          {loadingRecords ? (
            <p style={subText}>Loading records...</p>
          ) : filteredRecords.length === 0 ? (
            <div style={emptyBox}>No attendance records found for this filter.</div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "18px" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {["NAME", "ROLL", "SUBJECT", "SEM", "DATE", "TIME", "DISTANCE"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((r, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{r["Name"]}</td>
                      <td style={tdStyle}>{r["Roll No"]}</td>
                      <td style={tdStyle}>{r["Subject"]}</td>
                      <td style={tdStyle}>SEM {r["Semester"]}</td>
                      <td style={tdStyle}>{r["Date"]}</td>
                      <td style={tdStyle}>{r["Time"]}</td>
                      <td style={tdStyle}>{r["Distance"] ? `${r["Distance"]}m` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: "1150px",
  margin: "35px auto",
  padding: "0 20px",
  fontFamily: "'Courier New', monospace",
};

const cardStyle = {
  background: "#1b4332",
  border: "10px solid #b08968",
  borderRadius: "16px",
  padding: "30px",
  boxShadow: "0 10px 0 #081c15",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: "26px",
};

const titleStyle = {
  color: "#fefae0",
  fontSize: "28px",
  margin: 0,
  textTransform: "uppercase",
  textShadow: "3px 3px 0 #081c15",
};

const sectionTitle = {
  color: "#fefae0",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const subText = {
  color: "#b7e4c7",
  fontWeight: 700,
};

const miniText = {
  color: "#95d5b2",
  fontSize: "12px",
  fontWeight: 700,
};

const sectionBox = {
  background: "#081c15",
  border: "2px dashed #95d5b2",
  borderRadius: "12px",
  padding: "22px",
  marginBottom: "30px",
  textAlign: "center",
};

const controlRow = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "16px",
};

const inputStyle = {
  padding: "12px 16px",
  fontFamily: "'Courier New', monospace",
  fontWeight: 800,
  background: "#fefae0",
  color: "#123524",
  border: "2px dashed #95d5b2",
  borderRadius: "8px",
  minWidth: "170px",
};

const primaryBtn = {
  padding: "12px 18px",
  fontFamily: "'Courier New', monospace",
  fontWeight: 900,
  background: "#d8f3dc",
  color: "#123524",
  border: "2px dashed #95d5b2",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "3px 3px 0 #000",
};

const dangerBtn = {
  ...primaryBtn,
  background: "transparent",
  color: "#ffb4a2",
  border: "2px dashed #ffb4a2",
};

const alertStyle = {
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "18px",
  textAlign: "center",
  fontWeight: 800,
};

const qrBox = {
  display: "inline-block",
  background: "#fefae0",
  padding: "18px",
  borderRadius: "14px",
  border: "8px solid #b08968",
  boxShadow: "0 8px 0 #000",
};

const recordsHeader = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "12px",
  alignItems: "center",
  marginBottom: "18px",
};

const buttonGroup = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const emptyBox = {
  background: "#fefae0",
  color: "#123524",
  padding: "28px",
  borderRadius: "10px",
  fontWeight: 900,
  marginTop: "18px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fefae0",
  color: "#123524",
};

const thStyle = {
  padding: "12px",
  border: "2px solid #123524",
  fontSize: "12px",
};

const tdStyle = {
  padding: "12px",
  border: "2px solid #123524",
  fontWeight: 700,
};