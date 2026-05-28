"use client";



import Link from "next/link";

import {

  ClipboardList,

  LayoutDashboard,

  LogOut,

  MessageSquare,

  Stethoscope,

  UserCircle,

} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { ReactNode } from "react";

import type { DoctorDashboardSection } from "@/components/doctor/doctor-dashboard-sections";



const navItems: ReadonlyArray<{

  section: DoctorDashboardSection;

  label: string;

  icon: LucideIcon;

}> = [

  { section: "overview", label: "Overview", icon: LayoutDashboard },

  { section: "patients", label: "My Patients", icon: ClipboardList },

  { section: "reviews", label: "Reviews", icon: MessageSquare },

  { section: "profile", label: "Edit Profile", icon: UserCircle },

];



export type DoctorDashboardLayoutProps = {

  children: ReactNode;

  activeSection: DoctorDashboardSection;

  onSectionChange: (section: DoctorDashboardSection) => void;

  onSignOut: () => void;

  signingOut?: boolean;

};



export function DoctorDashboardLayout({

  children,

  activeSection,

  onSectionChange,

  onSignOut,

  signingOut = false,

}: DoctorDashboardLayoutProps) {

  return (

    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">

      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">

        <div className="border-b border-slate-100 px-5 py-6">

          <button

            type="button"

            onClick={() => onSectionChange("overview")}

            className="flex w-full items-center gap-2 text-left"

          >

            <span className="inline-flex rounded-lg bg-hc-brand/10 p-2 text-hc-brand">

              <Stethoscope className="h-5 w-5" aria-hidden />

            </span>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-hc-brand">

                Doctor portal

              </p>

              <p className="text-sm font-bold text-slate-900">HealthiConnect</p>

            </div>

          </button>

        </div>



        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Doctor dashboard">

          {navItems.map(({ section, label, icon: Icon }) => {

            const active = activeSection === section;



            return (

              <button

                key={section}

                type="button"

                onClick={() => onSectionChange(section)}

                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${

                  active

                    ? "bg-[rgba(38,118,127,0.12)] text-hc-brand"

                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"

                }`}

                aria-current={active ? "page" : undefined}

              >

                <Icon className="h-4 w-4 shrink-0" aria-hidden />

                {label}

              </button>

            );

          })}

        </nav>



        <div className="border-t border-slate-100 p-3">

          <button

            type="button"

            onClick={onSignOut}

            disabled={signingOut}

            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"

          >

            <LogOut className="h-4 w-4 shrink-0" aria-hidden />

            {signingOut ? "Signing out…" : "Sign out"}

          </button>

        </div>

      </aside>



      <div className="flex min-w-0 flex-1 flex-col">

        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">

          <Link href="/doctor/dashboard" className="text-sm font-bold text-slate-900">

            Doctor dashboard

          </Link>

          <button

            type="button"

            onClick={onSignOut}

            disabled={signingOut}

            className="text-sm font-medium text-hc-brand disabled:opacity-50"

          >

            Sign out

          </button>

        </header>



        <nav

          className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden"

          aria-label="Doctor dashboard mobile"

        >

          {navItems.map(({ section, label }) => {

            const active = activeSection === section;



            return (

              <button

                key={section}

                type="button"

                onClick={() => onSectionChange(section)}

                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${

                  active

                    ? "bg-[rgba(38,118,127,0.12)] text-hc-brand"

                    : "text-slate-600"

                }`}

              >

                {label}

              </button>

            );

          })}

        </nav>



        <main

          id="doctor-dashboard-main"

          className="flex-1 scroll-mt-4 p-4 sm:p-6 lg:p-8"

        >

          {children}

        </main>

      </div>

    </div>

  );

}

