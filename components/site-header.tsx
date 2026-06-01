"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Find Doctors" },
  { href: "/doctor/register", label: "For Doctors" },
  { href: "/specialties", label: "Specialties" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About Us" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="header-inner">
        <Link href="/" className="brand-logo">
          HealthiConnect
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={label} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/doctor/login" className="cta-btn">
            Doctor Sign In
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-main-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="menu-toggle__icon" aria-hidden />
            ) : (
              <Menu className="menu-toggle__icon" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <nav
        id="mobile-main-nav"
        className={`mobile-nav${menuOpen ? " mobile-nav--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={label}
            href={href}
            className="mobile-nav__link"
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
