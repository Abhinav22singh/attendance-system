import { useState } from "react";
import axios from "axios";

export default function TeacherLogin({ onLogin }) {
  const [teacherId, setTeacherId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", padding: "12px 16px", marginBottom: "12px",
    border: "2px dashed #d8f3dc", borderRadius: "8px",
    fontFamily: "'Courier New', monospace", fontSize: "14px",
    background: "#081c15", color: "#d8f3dc", outline: "none",
    boxSizing: "border-box"
  };

  const handleLogin = async () => {
    if (!teacherId || !password)
      return setMessage({ type: "error", text: "Please fill all fields!" });

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/teacher/login/", {
        teacher_id: teacherId,
        password
      });
      localStorage.setItem("teacher", JSON.stringify(res.data.teacher));
      onLogin(res.data.teacher);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Invalid credentials!" });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#1b4332", padding: "40px",
        borderRadius: "16px", border: "10px solid #b08968",
        boxShadow: "0 10px 0 #081c15",
        fontFamily: "'Courier New', monospace"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>👨‍🏫</div>
          <h2 style={{ color: "#fefae0", fontSize: "22px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
            TEACHER LOGIN
          </h2>
          <p style={{ color: "#b7e4c7", fontSize: "12px", marginTop: "6px", letterSpacing: "0.1em" }}>
            SVIST ATTENDANCE SYSTEM
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px", borderRadius: "8px", marginBottom: "16px",
            textAlign: "center", fontWeight: 700,
            background: message.type === "success" ? "#CCFFE8" : "#3d0000",
            color: message.type === "success" ? "#007744" : "#ff6b6b",
            border: `2px solid ${message.type === "success" ? "#00CC66" : "#ff3366"}`
          }}>
            {message.text}
          </div>
        )}

        <input
          type="text"
          placeholder="TEACHER ID (e.g. T001)"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ ...inputStyle, marginBottom: "20px" }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "16px", fontWeight: 700,
            fontSize: "15px", fontFamily: "'Courier New', monospace",
            textTransform: "uppercase", letterSpacing: "0.1em",
            background: "#d8f3dc", color: "#123524",
            border: "2px dashed #95d5b2", borderRadius: "8px",
            cursor: "pointer", boxShadow: "4px 4px 0 #081c15",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "⏳ LOGGING IN..." : "🔓 LOGIN"}
        </button>
      </div>
    </div>
  );
}