export default function Hero({ setPage, isLoggedIn, todayCount }) {
  const chalkBtn = () => ({
    padding: "18px 24px",
    fontSize: "15px",
    fontWeight: 700,
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.07em",
    border: "2px dashed #d8f3dc",
    background: "transparent",
    color: "#d8f3dc",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #081c15",
    width: "100%",
    transition: "0.3s",
  });

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .hero-box {
            margin: 24px 12px !important;
            padding: 34px 18px !important;
            border-width: 7px !important;
          }

          .hero-buttons {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        className="hero-box"
        style={{
          width: "calc(100% - 24px)",
          maxWidth: "1100px",
          margin: "40px auto 20px",
          padding: "50px 24px",
          textAlign: "center",
          border: "10px solid #b08968",
          borderRadius: "14px",
          background: "#1b4332",
          boxShadow: "0 10px 0 #081c15",
          overflow: "hidden",
        }}
      >
        {/* TOP TEXT */}

        <p
          style={{
            color: "#fefae0",
            fontSize: "clamp(12px, 3vw, 14px)",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}
        >
          ✦ WELCOME TO ✦
        </p>

        <h1
          style={{
            color: "#fefae0",
            fontSize: "clamp(30px, 9vw, 48px)",
            margin: "12px 0",
            textShadow: "3px 3px 0 #081c15",
            lineHeight: 1.2,
          }}
        >
          SVIST ATTENDANCE PORTAL
        </h1>

        <p
          style={{
            color: "#b7e4c7",
            fontSize: "clamp(13px, 4vw, 15px)",
            letterSpacing: "0.12em",
            marginBottom: "18px",
            lineHeight: 1.7,
          }}
        >
          SMART FACE RECOGNITION CAMPUS SYSTEM
        </p>

        {/* TODAY COUNT */}
{/* 
        <div
          style={{
            display: "inline-block",
            marginBottom: "34px",
            padding: "10px 18px",
            border: "2px dashed #95d5b2",
            borderRadius: "10px",
            background: "#081c15",
            color: "#d8f3dc",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.08em",
          }}
        >
          📌 TODAY'S ATTENDANCE: {todayCount}
        </div> */}

        {/* BUTTONS */}

        <div
          className="hero-buttons"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => setPage("register")}
                style={{
                  ...chalkBtn(),
                  background: "#fefae0",
                  color: "#123524",
                }}
              >
                📝 REGISTER STUDENT
              </button>

              <button
                onClick={() => setPage("login")}
                style={{
                  ...chalkBtn(),
                  background: "#fefae0",
                  color: "#123524",
                }}
              >
                🔐 STUDENT LOGIN
              </button>

              <button
                onClick={() => setPage("teacher")}
                style={{
                  ...chalkBtn(),
                  background: "#fefae0",
                  color: "#123524",
                }}
              >
                🛡️ TEACHER LOGIN
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setPage("attendance")}
                style={chalkBtn()}
              >
                📷 MARK ATTENDANCE
              </button>

              <button
                onClick={() => setPage("records")}
                style={chalkBtn()}
              >
                📊 VIEW RECORDS
              </button>
            </>
          )}
        </div>
      </section>
    </>
  );
}