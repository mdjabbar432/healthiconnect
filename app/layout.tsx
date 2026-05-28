import type { ReactNode } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./homepage-sections.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-montserrat">
        <header className="site-header sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="header-inner">
            <Link href="/" className="brand-logo">
              HealthiConnect
            </Link>

            <nav className="main-nav">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/doctors" className="nav-link">
                Find Doctors
              </Link>
              <Link href="/doctor/register" className="nav-link">
                For Doctors
              </Link>
              <Link href="#" className="nav-link">
                Specialties
              </Link>
              <Link href="/membership" className="nav-link">
                Membership
              </Link>
              <Link href="#" className="nav-link">
                About Us
              </Link>
            </nav>

            <Link href="/doctor/login" className="cta-btn">
              Doctor Sign In
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
