import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Hero from "../components/Hero";
import NoticeBoard from "../components/NoticeBoard";
import { API_BASE_URL } from "../config/api";

export default function Home({ setPage, isLoggedIn }) {
  const [notices, setNotices] = useState([]);

  // ================= NOTICES =================

  const fetchNotices = useCallback(async () => {
    // LOAD FROM CACHE FIRST

    const cachedNotices = localStorage.getItem("notices");

    if (cachedNotices) {
      setNotices(JSON.parse(cachedNotices));
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/notices/`
      );

      const freshNotices = res.data.notices || [];

      setNotices(freshNotices);

      // SAVE TO CACHE

      localStorage.setItem(
        "notices",
        JSON.stringify(freshNotices)
      );
    } catch (error) {
      console.log(error);

      if (!cachedNotices) {
        setNotices([]);
      }
    }
  }, []);

  // ================= LOAD DATA =================

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ================= UI =================

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "clamp(12px, 3vw, 32px)",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* HERO SECTION */}

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto clamp(20px, 4vw, 40px)",
          boxSizing: "border-box",
        }}
      >
        <Hero
          setPage={setPage}
          isLoggedIn={isLoggedIn}
        />
      </section>

      {/* NOTICE BOARD */}

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <NoticeBoard notices={notices} />
      </section>
    </main>
  );
}