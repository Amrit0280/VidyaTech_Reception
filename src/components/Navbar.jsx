import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { brand, navigation } from "../data/siteData.js";

export default function Navbar({ theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="site-header">
      <nav className="nav-shell">
        <Link to="/" className="brand-lockup" aria-label={`${brand.name} home`}>
          <span className="brand-mark">
            <img src={brand.logoIcon} alt="" aria-hidden="true" />
          </span>
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.motive}</small>
          </span>
        </Link>

        <div className="nav-links">
          {navigation.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/contact" className="btn btn-primary nav-cta">
            Book Demo
          </Link>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Open menu"
            title="Open menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobile-menu">
          {navigation.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <Link to="/contact" className="btn btn-primary" onClick={() => setOpen(false)}>
            Book Demo
          </Link>
        </div>
      )}
    </header>
  );
}
