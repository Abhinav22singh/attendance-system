import { useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Register({ onRegistered, goToPage }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({
    name: "",
    roll_no: "",
    email: "",
    branch: "",
    year: "",
    semester: "",
  });
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
    boxSizing: "border-box",
    color: "#123524",
    fontWeight: 700,
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
      setMessage(null);
    } catch {
      setMessage({
        type: "error",
        text: "Camera permission denied!",
      });
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      return setMessage({
        type: "error",
        text: "Camera not ready yet!",
      });
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setPhoto(dataUrl);

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }

    setStreaming(false);
  };

  const handleSubmit = async () => {
    if (!photo) {
      return setMessage({
        type: "error",
        text: "Please capture your photo first!",
      });
    }

    if (
      !form.name ||
      !form.roll_no ||
      !form.email ||
      !form.branch ||
      !form.year ||
      !form.semester
    ) {
      return setMessage({
        type: "error",
        text: "Please fill all fields!",
      });
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/register/`, {
        ...form,
        image: photo,
      });

      localStorage.setItem(
        "registeredUser",
        JSON.stringify({
          name: form.name,
          roll_no: form.roll_no,
          email: form.email,
          branch: form.branch,
          year: form.year,
          semester: form.semester,
        })
      );

      setMessage({
        type: "success",
        text: res.data.message || "Student registered successfully!",
      });

      setPhoto(null);
      setForm({
        name: "",
        roll_no: "",
        email: "",
        branch: "",
        year: "",
        semester: "",
      });

      if (onRegistered) {
        setTimeout(() => {
          onRegistered();
        }, 800);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Something went wrong",
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "560px",
        margin: "36px auto",
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
          fontSize: "24px",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: "24px",
          textTransform: "uppercase",
          textShadow: "3px 3px 0 #081c15",
        }}
      >
        📝 Student Registration
      </h2>

      {message && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            textAlign: "center",
            background: message.type === "success" ? "#d8f3dc" : "#ffe0e0",
            color: message.type === "success" ? "#123524" : "#cc0044",
            fontWeight: 800,
          }}
        >
          {message.text}
        </div>
      )}

      {["name", "roll_no", "email", "branch", "year"].map((field) => (
        <input
          key={field}
          type={field === "email" ? "email" : "text"}
          placeholder={field.replace("_", " ").toUpperCase()}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          style={inputStyle}
        />
      ))}

      <select
        value={form.semester}
        onChange={(e) => setForm({ ...form, semester: e.target.value })}
        style={inputStyle}
      >
        <option value="">SELECT SEMESTER</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <option key={s} value={s}>
            SEMESTER {s}
          </option>
        ))}
      </select>

      {!photo ? (
        <>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "3px dashed #d8f3dc",
              background: "#081c15",
            }}
          />

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!streaming ? (
            <button onClick={startCamera} style={btnStyle}>
              📷 Open Camera
            </button>
          ) : (
            <button onClick={capturePhoto} style={btnStyle}>
              📸 Capture Photo
            </button>
          )}
        </>
      ) : (
        <>
          <img
            src={photo}
            alt="captured"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "3px dashed #d8f3dc",
            }}
          />

          <button
            onClick={() => setPhoto(null)}
            style={{
              background: "none",
              border: "none",
              color: "#fefae0",
              cursor: "pointer",
              margin: "12px 0",
              fontWeight: 800,
            }}
          >
            ✖ Retake Photo
          </button>
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          ...btnStyle,
          width: "100%",
          marginTop: "16px",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "⏳ Registering..." : "✅ Register Student"}
      </button>

      <p
        onClick={() => {
          if (goToPage) goToPage("login");
        }}
        style={{
          color: "#fefae0",
          textAlign: "center",
          marginTop: "18px",
          cursor: "pointer",
          textDecoration: "underline",
          fontWeight: 800,
        }}
      >
        Already registered? Login here
      </p>
    </div>
  );
}

const btnStyle = {
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
  marginTop: "14px",
};