export default function Footer() {
  return (
    <footer
      style={{
        background: "#081c15",
        padding: "14px",
        textAlign: "center",
        borderTop: "5px solid #b08968",
        color: "#b7e4c7",
        fontSize: "12px",
        marginTop: "auto",
        letterSpacing: "0.08em",
      }}
    >
      © {new Date().getFullYear()} SVIST | Face Recognition Attendance System
    </footer>
  );
}