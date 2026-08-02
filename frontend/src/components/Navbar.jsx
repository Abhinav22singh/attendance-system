import logo from "../assets/svist-logo.png";

export default function Navbar({
  page,
  setPage,
  isLoggedIn,
  isTeacher,
  handleStudentLogout,
  handleTeacherLogout,
}) {
  const chalkBtn = (active) => ({
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.07em",
    border: "2px dashed #d8f3dc",
    background: active ? "#d8f3dc" : "transparent",
    color: active ? "#123524" : "#d8f3dc",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: active ? "3px 3px 0 #081c15" : "2px 2px 0 #081c15",
    whiteSpace: "nowrap",
    transition: "0.3s",
  });

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 768px) {
          .svist-nav {
            grid-template-columns: 1fr !important;
            text-align: center;
            padding: 14px !important;
          }

          .svist-brand {
            justify-content: center !important;
          }

          .svist-nav-buttons {
            justify-content: center !important;
            width: 100%;
          }

          .svist-nav-buttons button {
            flex: 1 1 140px;
          }
        }

        @media (max-width: 480px) {
          .svist-brand-title {
            font-size: 15px !important;
          }

          .svist-brand-subtitle {
            font-size: 10px !important;
          }

          .svist-nav-buttons button {
            flex: 1 1 100%;
          }
        }
      `}</style>

      {/* TOP MARQUEE */}

      <div
        style={{
          background: "#081c15",
          overflow: "hidden",
          padding: "10px 0",
          borderBottom: "4px solid #b08968",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "marquee 22s linear infinite",
            gap: "50px",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              style={{
                color: "#fefae0",
                fontSize: "13px",
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: "0.1em",
              }}
            >
              ✎ Swami Vivekananda Institute of Science & Technology | Smart Face
              Recognition Attendance System ✎
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}

      <nav
        className="svist-nav"
        style={{
          background: "#1b4332",
          padding: "14px 22px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "16px",
          borderBottom: "5px solid #b08968",
          boxShadow: "0 5px 0 #081c15",
          overflow: "hidden",
        }}
      >
        {/* LEFT LOGO */}

        <div
          className="svist-brand"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <img
            src={logo}
            alt="SVIST Logo"
            style={{
              width: "48px",
              height: "48px",
              objectFit: "contain",
              border: "2px solid #fefae0",
              borderRadius: "50%",
              background: "#fff",
              padding: "4px",
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0 }}>
            <p
              className="svist-brand-title"
              style={{
                color: "#fefae0",
                fontWeight: 800,
                fontSize: "17px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              SVIST ATTENDANCE
            </p>

            <p
              className="svist-brand-subtitle"
              style={{
                color: "#b7e4c7",
                fontSize: "11px",
                margin: 0,
                letterSpacing: "0.1em",
              }}
            >
              Face Recognition Attendance
            </p>
          </div>
        </div>

        {/* BUTTONS */}

        <div
          className="svist-nav-buttons"
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* ================= NORMAL VISITOR ================= */}

          {!isLoggedIn && !isTeacher && (
            <>
              <button
                onClick={() => setPage("home")}
                style={chalkBtn(page === "home")}
              >
                🏫 HOME
              </button>

              <button
                onClick={() => setPage("register")}
                style={chalkBtn(page === "register")}
              >
                📝 REGISTER
              </button>

              <button
                onClick={() => setPage("login")}
                style={chalkBtn(page === "login")}
              >
                🔐 LOGIN
              </button>

              <button
                onClick={() => setPage("teacher")}
                style={chalkBtn(page === "teacher")}
              >
                👨‍🏫 TEACHER
              </button>
            </>
          )}

          {/* ================= STUDENT LOGGED IN ================= */}

          {isLoggedIn && !isTeacher && (
            <>
              <button
                onClick={() => setPage("home")}
                style={chalkBtn(page === "home")}
              >
                🏫 HOME
              </button>

              <button
                onClick={() => setPage("attendance")}
                style={chalkBtn(page === "attendance")}
              >
                📷 ATTENDANCE
              </button>

              <button
                onClick={() => setPage("records")}
                style={chalkBtn(page === "records")}
              >
                📊 RECORDS
              </button>

              <button
                onClick={handleStudentLogout}
                style={{
                  ...chalkBtn(false),
                  border: "2px dashed #ffb4a2",
                  color: "#ffb4a2",
                }}
              >
                🚪 LOGOUT
              </button>
            </>
          )}

          {/* ================= TEACHER LOGGED IN ================= */}

          {isTeacher && (
            <>
              <button
                onClick={() => setPage("home")}
                style={chalkBtn(page === "home")}
              >
                🏫 HOME
              </button>

              <button
                onClick={() => setPage("teacher")}
                style={chalkBtn(page === "teacher")}
              >
                👨‍🏫 DASHBOARD
              </button>

              <button
                onClick={handleTeacherLogout}
                style={{
                  ...chalkBtn(false),
                  border: "2px dashed #ffb4a2",
                  color: "#ffb4a2",
                }}
              >
                🚪 TEACHER LOGOUT
              </button>
            </>
          )}

          {/* ONLINE STATUS */}

          <div
  title="ONLINE"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "linear-gradient(135deg,#081c15,#0f2d22)",
    border: "1px dashed #95d5b2",
    width: "fit-content",
    cursor: "pointer",
    boxShadow:
      "0 0 14px rgba(82,255,158,0.18), inset 0 0 8px rgba(149,213,178,0.08)",
    transition: "0.3s",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow =
      "0 0 18px rgba(82,255,158,0.4), inset 0 0 10px rgba(149,213,178,0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow =
      "0 0 14px rgba(82,255,158,0.18), inset 0 0 8px rgba(149,213,178,0.08)";
  }}
>
  <span className="live-dot"></span>
  <span className="live-dot delay"></span>
</div>
        </div>
      </nav>
    </>
  );
}