import { useState } from "react";

export default function NoticeBoard({ notices }) {
  const [selectedNotice, setSelectedNotice] = useState(null);

  return (
    <>
      <section
        style={{
          maxWidth: "1100px",
          margin: "35px auto",
          background: "#1b4332",
          border: "10px solid #b08968",
          borderRadius: "14px",
          padding: "30px",
          boxShadow: "0 10px 0 #081c15",
        }}
      >
        <h2
          style={{
            color: "#fefae0",
            fontSize: "32px",
            textAlign: "center",
            marginBottom: "28px",
            letterSpacing: "0.12em",
            textShadow: "3px 3px 0 #081c15",
          }}
        >
          📌 NOTICE BOARD
        </h2>

        {notices.length === 0 ? (
          <p
            style={{
              color: "#fefae0",
              textAlign: "center",
              fontWeight: 800,
            }}
          >
            No notices available
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "20px",
            }}
          >
            {notices.map((notice, index) => (
              <div
                key={index}
                onClick={() => setSelectedNotice(notice)}
                style={{
                  background:
                    index % 5 === 0
                      ? "#fff3b0"
                      : index % 5 === 1
                      ? "#d8f3dc"
                      : index % 5 === 2
                      ? "#ffd6e0"
                      : index % 5 === 3
                      ? "#dbeafe"
                      : "#fefae0",
                  color: "#081c15",
                  borderRadius: "10px",
                  padding: "20px",
                  minHeight: "170px",
                  boxShadow: "5px 5px 0 #081c15",
                  border: "2px solid rgba(0,0,0,0.25)",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#dc2626",
                    position: "absolute",
                    top: "-9px",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />

                <p
                  style={{
                    margin: "8px 0 10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#1b4332",
                  }}
                >
                  {notice.date}
                </p>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(0,0,0,0.3)",
                    marginBottom: "12px",
                  }}
                />

                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "16px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {notice.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "1.6",
                    fontWeight: 600,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {notice.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedNotice && (
        <div
          onClick={() => setSelectedNotice(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(700px, 95vw)",
              background: "#fefae0",
              color: "#081c15",
              borderRadius: "16px",
              padding: "34px",
              border: "8px solid #b08968",
              boxShadow: "0 12px 0 #081c15",
            }}
          >
            <button
              onClick={() => setSelectedNotice(null)}
              style={{
                float: "right",
                background: "#cc0044",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ×
            </button>

            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1b4332" }}>
              📅 {selectedNotice.date}
            </p>

            <h2
              style={{
                fontSize: "28px",
                margin: "10px 0 18px",
                textTransform: "uppercase",
              }}
            >
              📌 {selectedNotice.title}
            </h2>

            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.8",
                fontWeight: 700,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedNotice.text}
            </p>
          </div>
        </div>
      )}
    </>
  );
}