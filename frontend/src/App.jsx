import { useEffect, useState } from "react";

import Register from "./pages/Register";
import Login from "./pages/Login";
import MarkAttendance from "./pages/MarkAttendance";
import Records from "./pages/Records";
import Home from "./pages/Home";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {

  // ================= PAGE =================

  const [page, setPage] = useState(
    localStorage.getItem("currentPage") || "home"
  );

  // ================= STUDENT =================

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true" &&
    !localStorage.getItem("admin_token") &&
    !localStorage.getItem("teacher")
  );

  // ================= ADMIN =================

  const [isAdmin, setIsAdmin] = useState(
    !!localStorage.getItem("admin_token")
  );

  // ================= TEACHER =================

  const [teacher, setTeacher] = useState(
    JSON.parse(localStorage.getItem("teacher") || "null")
  );

  // ================= SAVE PAGE =================

  useEffect(() => {
    localStorage.setItem("currentPage", page);
  }, [page]);

  // ================= REGISTER =================

  const handleRegistered = () => {
    setPage("login");
  };

  // ================= STUDENT LOGIN =================

  const handleStudentLogin = () => {

    localStorage.setItem("isLoggedIn", "true");

    localStorage.removeItem("admin_token");
    localStorage.removeItem("teacher");

    setIsLoggedIn(true);
    setIsAdmin(false);
    setTeacher(null);

    setPage("home");
  };

  // ================= STUDENT LOGOUT =================

  const handleStudentLogout = () => {

    localStorage.removeItem("loggedStudent");
    localStorage.removeItem("isLoggedIn");

    setIsLoggedIn(false);
    setIsAdmin(false);
    setTeacher(null);

    setPage("home");
  };

  // ================= ADMIN LOGIN =================

  const handleAdminLogin = () => {

    localStorage.setItem("admin_token", "true");

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedStudent");
    localStorage.removeItem("teacher");

    setIsAdmin(true);
    setIsLoggedIn(false);
    setTeacher(null);

    setPage("admin");
  };

  // ================= ADMIN LOGOUT =================

  const handleAdminLogout = () => {

    localStorage.removeItem("admin_token");

    setIsAdmin(false);
    setIsLoggedIn(false);

    setPage("home");
  };

  // ================= TEACHER LOGIN =================

  const handleTeacherLogin = (teacherData) => {

    localStorage.setItem(
      "teacher",
      JSON.stringify(teacherData)
    );

    localStorage.removeItem("admin_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedStudent");

    setTeacher(teacherData);

    setIsAdmin(false);
    setIsLoggedIn(false);

    setPage("teacher");
  };

  // ================= TEACHER LOGOUT =================

  const handleTeacherLogout = () => {

    localStorage.removeItem("teacher");

    setTeacher(null);

    setIsAdmin(false);
    setIsLoggedIn(false);

    setPage("home");
  };

  // ================= UI =================

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#123524",
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        fontFamily: "'Courier New', monospace",
        color: "#d8f3dc",
        minHeight: "100vh",
      }}
    >

      {/* NAVBAR */}

      <Navbar
        page={page}
        setPage={setPage}

        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        isTeacher={!!teacher}

        handleStudentLogout={handleStudentLogout}
        handleAdminLogout={handleAdminLogout}
        handleTeacherLogout={handleTeacherLogout}
      />

      {/* MAIN */}

      <main style={{ flex: 1 }}>

        {/* HOME */}

        {page === "home" && (
          <Home
            setPage={setPage}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* REGISTER */}

        {page === "register" && (
          <Register
            onRegistered={handleRegistered}
            goToPage={setPage}
          />
        )}

        {/* LOGIN */}

        {page === "login" && (
          <Login
            goToPage={setPage}
            onLogin={handleStudentLogin}
          />
        )}

        {/* ATTENDANCE */}

        {page === "attendance" && isLoggedIn && (
          <MarkAttendance
            goToPage={setPage}
          />
        )}

        {/* RECORDS */}

        {page === "records" && isLoggedIn && (
          <Records />
        )}

        {/* ADMIN LOGIN */}

        {page === "admin" && !isAdmin && (
          <AdminLogin
            onLogin={handleAdminLogin}
          />
        )}

        {/* ADMIN DASHBOARD */}

        {page === "admin" && isAdmin && (
          <AdminDashboard
            onLogout={handleAdminLogout}
          />
        )}

        {/* TEACHER LOGIN */}

        {page === "teacher" && !teacher && (
          <TeacherLogin
            onLogin={handleTeacherLogin}
          />
        )}

        {/* TEACHER DASHBOARD */}

        {page === "teacher" && teacher && (
          <TeacherDashboard
            teacher={teacher}
            onLogout={handleTeacherLogout}
          />
        )}

      </main>

      {/* FLOATING ADMIN BUTTON */}

      {!isLoggedIn && !isAdmin && !teacher && (
        <button
          onClick={() => setPage("admin")}
          style={{
            position: "fixed",
            right: "20px",
            bottom: "24px",
            zIndex: 9999,

            padding: "14px 18px",

            borderRadius: "50px",

            border: "3px solid #b08968",

            background: "#1b4332",

            color: "#fefae0",

            fontWeight: 900,

            cursor: "pointer",

            boxShadow: "4px 4px 0 #081c15",

            fontFamily: "'Courier New', monospace",
          }}
        >
          🛡️ Admin
        </button>
      )}

      {/* FOOTER */}

      <Footer />

    </div>
  );
}