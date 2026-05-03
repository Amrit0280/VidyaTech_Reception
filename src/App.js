import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Services from "./pages/Services.jsx";
import Demo from "./pages/Demo.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import Contact from "./pages/Contact.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

export default function App() {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    const userSelectedTheme = localStorage.getItem("theme_user_selected") === "true";
    return userSelectedTheme && savedTheme ? savedTheme : "light";
  });

  const setTheme = (nextTheme) => {
    const resolvedTheme = typeof nextTheme === "function" ? nextTheme(theme) : nextTheme;
    localStorage.setItem("theme_user_selected", "true");
    setThemeState(resolvedTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Navbar theme={theme} setTheme={setTheme} />
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
