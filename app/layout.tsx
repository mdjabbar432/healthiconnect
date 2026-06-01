import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
