import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin, goToPage }) {
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "12px",
    border: "3px dashed #d8f3dc",
    borderRadius: "8px",
    fontFamily: "'Courier New', monospace",
    fontSize: "14px",
    background: "#fefae0",
    outline: "none",
    boxShadow: "3px 3px 0 #081c15",
    color: "#123524",
    fontWeight: 700,
    boxSizing: "border-box",
  };

  const handleLogin = async () => {
    if (!rollNo.trim() || !name.trim()) {
      return setMessage({
        type: "error",
        text: "Please enter roll no and name!",
      });
    }

    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/student-login/", {
        roll_no: rollNo.trim(),
        name: name.trim(),
      });

      const student = res.data.student;

      localStorage.setItem("loggedStudent", JSON.stringify(student));
      localStorage.setItem("isLoggedIn", "true");

      if (onLogin) onLogin(student);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Invalid login details",
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "40px auto",
        background: "#1b4332",
        padding: "32px",
        borderRadius: "16px",
        border: "10px solid #b08968",
        boxShadow: "0 10px 0 #081c15",
        fontFamily: "'Courier New', monospace",
      }}
    >
      <h2
        style={{
          color: "#fefae0",
          fontSize: "26px",
          textAlign: "center",
          marginBottom: "24px",
          textTransform: "uppercase",
          textShadow: "3px 3px 0 #081c15",
        }}
      >
        🔐 Student Login
      </h2>

      {message && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            textAlign: "center",
            background: "#ffe0e0",
            color: "#cc0044",
            fontWeight: 800,
          }}
        >
          {message.text}
        </div>
      )}

      <input
        type="text"
        placeholder="ENTER ROLL NO"
        value={rollNo}
        onChange={(e) => setRollNo(e.target.value)}
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="ENTER NAME"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 32px",
          fontWeight: 800,
          fontSize: "14px",
          fontFamily: "'Courier New', monospace",
          textTransform: "uppercase",
          background: "#fefae0",
          color: "#123524",
          border: "3px dashed #d8f3dc",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "4px 4px 0 #081c15",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "⏳ Logging in..." : "✅ Login"}
      </button>

      <p
        onClick={() => goToPage("register")}
        style={{
          color: "#fefae0",
          textAlign: "center",
          marginTop: "18px",
          cursor: "pointer",
          textDecoration: "underline",
          fontWeight: 800,
        }}
      >
        New student? Register first
      </p>
    </div>
  );
}