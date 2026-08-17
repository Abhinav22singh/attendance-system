import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", padding: "12px 16px", marginBottom: "12px",
    border: "3px solid #FF3366", borderRadius: "8px",
    fontFamily: "'Courier New', monospace", fontSize: "14px",
    background: "#FFF0F5", outline: "none",
    boxShadow: "3px 3px 0 #FF3366", boxSizing: "border-box"
  };

  const handleLogin = async () => {
    if (!username || !password)
      return setMessage({ type: "error", text: "Please fill all fields!" });

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login/`, {
        username, password
      });
      localStorage.setItem("admin_token", res.data.access);
      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(() => onLogin(), 1000);
    } catch (err) {
      setMessage({ type: "error", text: "Invalid username or password!" });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "80vh", display: "flex",
      alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#fff", padding: "40px",
        borderRadius: "16px", border: "3px solid #FF3366",
        boxShadow: "6px 6px 0 #CC0044",
        fontFamily: "'Courier New', monospace"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🔒</div>
          <h2 style={{
            color: "#CC0044", fontSize: "22px", fontWeight: 700,
            textTransform: "uppercase", margin: 0,
            textShadow: "2px 2px 0 #FF6B9D"
          }}>ADMIN LOGIN</h2>
          <p style={{ color: "#999", fontSize: "12px", marginTop: "6px", letterSpacing: "0.1em" }}>
            SVIST ATTENDANCE SYSTEM
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px", borderRadius: "8px", marginBottom: "16px",
            textAlign: "center", fontWeight: 700,
            background: message.type === "success" ? "#CCFFE8" : "#FFE0E0",
            color: message.type === "success" ? "#007744" : "#CC0044",
            border: `2px solid ${message.type === "success" ? "#00CC66" : "#FF3366"}`
          }}>
            {message.text}
          </div>
        )}

        <input
          type="text"
          placeholder="USERNAME"
          value={username}
          onChange={e => setUsername(e.target.value)}
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
            background: "#FF3366", color: "#fff",
            border: "3px solid #CC0044", borderRadius: "8px",
            cursor: "pointer", boxShadow: "5px 5px 0 #CC0044",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "⏳ LOGGING IN..." : "🔓 LOGIN"}
        </button>
      </div>
    </div>
  );
}