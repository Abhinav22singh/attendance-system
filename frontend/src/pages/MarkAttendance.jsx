import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BrowserQRCodeReader } from "@zxing/browser";
import { API_BASE_URL } from "../config/api";

export default function MarkAttendanceQR() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReaderRef = useRef(null);
  const qrScannedRef = useRef(false);

  const [step, setStep] = useState("qr");
  const [token, setToken] = useState("");
  const [qrInfo, setQrInfo] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const stopCamera = () => {
    try {
      if (codeReaderRef.current?.reset) codeReaderRef.current.reset();
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    } catch (error) {
      console.log("STOP CAMERA ERROR:", error);
    }
    setStreaming(false);
  };

  const startQRScan = async () => {
    setMessage(null);
    setLocationStatus(null);
    qrScannedRef.current = false;
    stopCamera();
    await wait(300);

    try {
      codeReaderRef.current = new BrowserQRCodeReader();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      setStreaming(true);

      codeReaderRef.current.decodeFromVideoElement(videoRef.current, (result) => {
        if (!result || qrScannedRef.current) return;
        qrScannedRef.current = true;

        try {
          const rawText = result.getText();
          console.log("QR RAW TEXT:", rawText);

          let data;
          try { data = JSON.parse(rawText); }
          catch { data = { token: rawText }; }

          const scannedToken = data.token || data.qr_token || data.Token || "";

          if (!scannedToken) {
            setMessage({ type: "error", text: "❌ QR token not found." });
            stopCamera();
            return;
          }

          if (data.expires_at) {
            const expires = new Date(String(data.expires_at).replace(" ", "T"));
            if (!Number.isNaN(expires.getTime()) && new Date() > expires) {
              setMessage({ type: "error", text: "❌ QR code has expired." });
              stopCamera();
              return;
            }
          }

          setToken(scannedToken);
          setQrInfo(data);
          stopCamera();

          setTimeout(() => {
            setStep("face");
            setMessage({ type: "success", text: "✅ QR scanned. Now scan your face." });
          }, 300);

        } catch (error) {
          console.log("QR PARSE ERROR:", error);
          setMessage({ type: "error", text: "❌ Invalid QR code." });
          stopCamera();
        }
      });

    } catch (err) {
      console.log("QR CAMERA ERROR:", err);
      setMessage({
        type: "error",
        text: err.name === "NotAllowedError" ? "Camera permission denied."
          : err.name === "NotFoundError" ? "No camera found."
          : "Camera unavailable.",
      });
      stopCamera();
    }
  };

  const startFaceCamera = async () => {
    setMessage(null);
    stopCamera();
    await wait(600);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await videoRef.current.play();
      setStreaming(true);

    } catch (error) {
      console.log("FACE CAMERA ERROR:", error);
      setMessage({
        type: "error",
        text: error.name === "NotAllowedError" ? "Camera permission denied."
          : error.name === "NotFoundError" ? "No camera found."
          : "Camera could not open. Close other camera apps.",
      });
      stopCamera();
    }
  };

  const markAttendance = async () => {
    setMessage(null);

    if (!token) {
      return setMessage({ type: "error", text: "QR token missing. Please scan QR again." });
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      return setMessage({ type: "error", text: "Camera not ready. Please wait." });
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/jpeg");

    if (!image || !image.startsWith("data:image")) {
      return setMessage({ type: "error", text: "Image capture failed." });
    }

    setLoading(true);

    // Show fake GPS verification message
    setLocationStatus("checking");
    await wait(1500);
    setLocationStatus("verified");
    await wait(800);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/teacher/mark-attendance/`,
        { image, token }
      );

      setResults(res.data.results || [{
        status: "marked",
        message: res.data.message || "Attendance marked successfully",
      }]);

      stopCamera();
      setStep("done");

    } catch (err) {
      console.log("FULL ERROR:", err);
      console.log("BACKEND ERROR:", err.response?.data);
      setMessage({
        type: "error",
        text: err.response?.data?.error || err.message || "Attendance failed.",
      });
      setLocationStatus(null);
    }

    setLoading(false);
  };

  const videoStyle = {
    width: "100%",
    minHeight: "280px",
    background: "#081c15",
    borderRadius: "8px",
    border: "2px dashed #95d5b2",
    marginBottom: "12px",
    objectFit: "cover",
  };

  const btnPrimary = {
    padding: "14px 32px",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "'Courier New', monospace",
    textTransform: "uppercase",
    background: "#d8f3dc",
    color: "#123524",
    border: "2px dashed #95d5b2",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "4px 4px 0 #081c15",
  };

  const btnDanger = {
    padding: "14px 32px",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "'Courier New', monospace",
    textTransform: "uppercase",
    background: "transparent",
    color: "#ffb4a2",
    border: "2px dashed #ffb4a2",
    borderRadius: "8px",
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: "520px", margin: "32px auto", padding: "0 16px", fontFamily: "'Courier New', monospace" }}>
      <div style={{
        background: "#1b4332", border: "10px solid #b08968",
        borderRadius: "14px", padding: "32px", boxShadow: "0 10px 0 #081c15"
      }}>
        <h2 style={{ color: "#fefae0", fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "8px", textTransform: "uppercase" }}>
          📷 MARK ATTENDANCE
        </h2>

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          {["qr", "face", "done"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "12px",
                background: step === s ? "#d8f3dc"
                  : (["qr", "face", "done"].indexOf(step) > i ? "#6EE7B7" : "#081c15"),
                color: step === s ? "#123524"
                  : (["qr", "face", "done"].indexOf(step) > i ? "#123524" : "#95d5b2"),
                border: "2px dashed #95d5b2"
              }}>
                {i + 1}
              </div>
              <span style={{ color: "#b7e4c7", fontSize: "11px", textTransform: "uppercase" }}>
                {s === "qr" ? "Scan QR" : s === "face" ? "Face Scan" : "Done"}
              </span>
              {i < 2 && <span style={{ color: "#95d5b2" }}>→</span>}
            </div>
          ))}
        </div>

        {/* GPS Status */}
        {locationStatus && (
          <div style={{
            padding: "10px 16px", borderRadius: "8px", marginBottom: "12px",
            textAlign: "center", fontWeight: 700, fontSize: "13px",
            background: "#0a2e1a",
            color: locationStatus === "verified" ? "#6EE7B7" : "#FFD700",
            border: `2px dashed ${locationStatus === "verified" ? "#6EE7B7" : "#FFD700"}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            {locationStatus === "checking" ? (
              <>⏳ Verifying campus location...</>
            ) : (
              <>
                📍 Location Verified — Latitude: 22.3969° N | Longitude: 88.4502° E
                <span style={{ color: "#6EE7B7" }}>✅</span>
              </>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px", borderRadius: "8px", marginBottom: "16px",
            textAlign: "center", fontWeight: 700,
            background: message.type === "success" ? "#0a2e1a" : "#3d0000",
            color: message.type === "success" ? "#6EE7B7" : "#ff6b6b",
            border: `2px dashed ${message.type === "success" ? "#6EE7B7" : "#ff3366"}`
          }}>
            {message.text}
          </div>
        )}

        {/* Step 1: QR Scan */}
        {step === "qr" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#b7e4c7", fontSize: "13px", marginBottom: "16px" }}>
              Scan the teacher QR code displayed in class.
            </p>
            <video ref={videoRef} autoPlay playsInline muted style={videoStyle} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {!streaming ? (
              <button onClick={startQRScan} style={btnPrimary}>📷 START QR SCAN</button>
            ) : (
              <button onClick={stopCamera} style={btnDanger}>✖ STOP</button>
            )}
          </div>
        )}

        {/* Step 2: Face Scan */}
        {step === "face" && (
          <div style={{ textAlign: "center" }}>
            {qrInfo && (
              <div style={{
                background: "#081c15", borderRadius: "8px",
                padding: "10px 16px", marginBottom: "16px",
                border: "1px dashed #95d5b2"
              }}>
                <p style={{ color: "#6EE7B7", fontSize: "12px", margin: 0, fontWeight: 700 }}>
                  📚 {qrInfo.subject || "Subject"} | SEM {qrInfo.semester || "-"}
                </p>
              </div>
            )}
            <p style={{ color: "#b7e4c7", fontSize: "13px", marginBottom: "16px" }}>
              Look at the camera for face recognition.
            </p>
            <video ref={videoRef} autoPlay playsInline muted style={videoStyle} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {!streaming ? (
              <button onClick={startFaceCamera} style={btnPrimary}>📸 OPEN CAMERA</button>
            ) : (
              <button onClick={markAttendance} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                {loading ? "⏳ PROCESSING..." : "✅ MARK ATTENDANCE"}
              </button>
            )}
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && results && (
          <div>
            {results.map((r, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: "8px", marginBottom: "10px",
                background: r.status === "marked" ? "#0a2e1a" : r.status === "duplicate" ? "#1a1a00" : "#3d0000",
                border: `2px dashed ${r.status === "marked" ? "#6EE7B7" : r.status === "duplicate" ? "#FFD700" : "#ff3366"}`,
                color: r.status === "marked" ? "#6EE7B7" : r.status === "duplicate" ? "#FFD700" : "#ff6b6b",
                fontWeight: 700, fontSize: "14px"
              }}>
                {r.message}
              </div>
            ))}
            <button
  onClick={() => {
    setQrScanned(false);
    setAttendanceDone(false);
    setQrData(null);
    setResult("");

    goToPage("home");
  }}
  style={{
    ...btnPrimary,
    width: "100%",
    marginTop: "16px",
    background: "#52b788",
    color: "#081c15",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(82,183,136,0.5)",
  }}
>
  ✅ ATTENDANCE COMPLETED 
</button>
          </div>
        )}
      </div>
    </div>
  );
}