"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";

export type DoctorBookingPanelProps = {
  doctorId: string;
  doctorName: string;
};

type SlotOption = {
  key: string;
  dayLabel: string;
  timeLabel: string;
};

type ConfirmResponse = {
  success?: boolean;
  emailSent?: boolean;
  emailMode?: "resend" | "preview";
  error?: string;
};

function buildSlots(now: Date): SlotOption[] {
  const slots: SlotOption[] = [];
  const times = ["9:00 AM", "11:30 AM", "2:15 PM", "4:30 PM"];

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    const dayLabel = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    for (let ti = 0; ti < times.length; ti++) {
      slots.push({
        key: `${dayOffset}-${ti}`,
        dayLabel,
        timeLabel: times[ti] ?? "",
      });
    }
    if (slots.length >= 12) break;
  }

  return slots.slice(0, 12);
}

export function DoctorBookingPanel({
  doctorId,
  doctorName,
}: DoctorBookingPanelProps) {
  const slots = useMemo(() => buildSlots(new Date()), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [emailMode, setEmailMode] = useState<"resend" | "preview" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedSlot = slots.find((s) => s.key === selected);

  async function handleConfirm() {
    if (!selected || !selectedSlot || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/appointments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          doctorName,
          dayLabel: selectedSlot.dayLabel,
          timeLabel: selectedSlot.timeLabel,
          slotKey: selectedSlot.key,
          ...(patientName.trim()
            ? { patientName: patientName.trim() }
            : {}),
          ...(patientEmail.trim()
            ? { patientEmail: patientEmail.trim() }
            : {}),
        }),
      });

      const data = (await res.json()) as ConfirmResponse;

      if (!res.ok) {
        setSubmitError(
          data.error ??
            "We could not send your appointment details. Please try again.",
        );
        return;
      }

      setEmailMode(data.emailMode ?? null);
      setConfirmed(true);
    } catch {
      setSubmitError(
        "Network error — check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed && selectedSlot) {
    return (
      <aside
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-8 w-8 shrink-0 text-hc-brand"
            aria-hidden
          />
          <div>
            <h2 className="text-lg font-bold text-hc-brand">
              Appointment confirmed
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-hc-muted">
              Your visit with{" "}
              <span className="font-semibold text-slate-800">{doctorName}</span>{" "}
              is scheduled for{" "}
              <span className="font-semibold text-slate-800">
                {selectedSlot.dayLabel}
              </span>{" "}
              at{" "}
              <span className="font-semibold text-slate-800">
                {selectedSlot.timeLabel}
              </span>
              .
            </p>
            <p className="mt-3 text-sm leading-relaxed text-hc-muted">
              {emailMode === "preview" ? (
                <>
                  Booking details were processed for email delivery (preview
                  mode — check your dev server console). Add{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                    RESEND_API_KEY
                  </code>{" "}
                  to send real messages.
                </>
              ) : (
                <>
                  Booking details were emailed to the clinic team. You will
                  receive follow-up instructions if contact details were
                  provided.
                </>
              )}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-hc-brand" aria-hidden />
        <div>
          <h2 className="text-lg font-bold text-hc-brand">Book a visit</h2>
          <p className="text-sm text-hc-muted">
            Choose an open slot, then confirm. Example availability — replace
            with live calendar data later.
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Available appointment times"
      >
        {slots.map((slot) => {
          const isSelected = slot.key === selected;
          return (
            <button
              key={slot.key}
              type="button"
              onClick={() => setSelected(slot.key)}
              disabled={submitting}
              aria-pressed={isSelected}
              className={`rounded-xl border px-2 py-2.5 text-left text-xs font-semibold transition sm:text-sm ${
                isSelected
                  ? "border-hc-brand bg-[rgba(38,118,127,0.1)] text-hc-brand ring-2 ring-hc-brand/30"
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
              } disabled:opacity-50`}
            >
              <span className="block text-[0.68rem] font-medium uppercase tracking-wide text-slate-500">
                {slot.dayLabel}
              </span>
              <span className="block">{slot.timeLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your details (optional)
        </p>
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            disabled={submitting}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50"
          />
        </label>
        <label className="block">
          <span className="sr-only">Your email</span>
          <input
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            disabled={submitting}
            placeholder="Your email (optional)"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50"
          />
        </label>
      </div>

      {submitError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!selected || submitting}
        onClick={() => void handleConfirm()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-hc-brand py-3 text-[0.9375rem] font-bold text-white transition hover:bg-hc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-hc-brand"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Confirm appointment"
        )}
      </button>

      {!selected ? (
        <p className="mt-3 text-center text-xs text-hc-muted">
          Select a time slot to enable confirmation.
        </p>
      ) : null}
    </aside>
  );
}
