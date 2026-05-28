"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/admin/dashboard#doctor-approvals",
    label: "Doctor approvals",
    icon: ShieldCheck,
  },
  {
    href: "/admin/dashboard#partner-management",
    label: "Partners",
    icon: Building2,
  },
] as const;

export type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-5 py-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="inline-flex rounded-lg bg-hc-brand/10 p-2 text-hc-brand">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hc-brand">
                Admin portal
              </p>
              <p className="text-sm font-bold text-slate-900">HealthiConnect</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Admin">
          {navItems.map(({ href, label, icon: Icon }) => {
            const path = href.split("#")[0];
            const active =
              pathname === path || pathname.startsWith(`${path}/`);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[rgba(38,118,127,0.12)] text-hc-brand"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-hc-brand"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-bold text-slate-900">Admin</p>
          <Link href="/" className="text-sm font-medium text-hc-brand">
            Site
          </Link>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden"
          aria-label="Admin mobile"
        >
          {navItems.map(({ href, label }) => {
            const path = href.split("#")[0];
            const active =
              pathname === path || pathname.startsWith(`${path}/`);

            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                  active
                    ? "bg-[rgba(38,118,127,0.12)] text-hc-brand"
                    : "text-slate-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
