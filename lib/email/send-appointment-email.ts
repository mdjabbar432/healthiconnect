import { Resend } from "resend";
import type { ConfirmAppointmentInput } from "@/lib/validations/appointment";
import {
  getAppointmentNotifyEmail,
  getEmailFromAddress,
  isResendConfigured,
} from "@/lib/email/config";

export type AppointmentEmailPayload = ConfirmAppointmentInput;

export type SendAppointmentEmailResult =
  | { ok: true; mode: "resend"; id: string }
  | { ok: true; mode: "preview" }
  | { ok: false; error: string };

function buildSubject(payload: AppointmentEmailPayload): string {
  return `New appointment request — ${payload.doctorName}`;
}

function buildPlainText(payload: AppointmentEmailPayload): string {
  const lines = [
    "A patient requested an appointment on HealthiConnect.",
    "",
    `Doctor: ${payload.doctorName}`,
    `Doctor ID: ${payload.doctorId}`,
    `Date: ${payload.dayLabel}`,
    `Time: ${payload.timeLabel}`,
    `Slot key: ${payload.slotKey}`,
  ];

  if (payload.patientName) {
    lines.push(`Patient name: ${payload.patientName}`);
  }
  if (payload.patientEmail) {
    lines.push(`Patient email: ${payload.patientEmail}`);
  }

  lines.push(
    "",
    "This is an automated notification. Replace APPOINTMENT_NOTIFY_EMAIL in .env.local with the client's address when ready.",
  );

  return lines.join("\n");
}

function buildHtml(payload: AppointmentEmailPayload): string {
  const patientRows = [
    payload.patientName
      ? `<tr><td style="padding:8px 12px;color:#64748b;">Patient</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(payload.patientName)}</td></tr>`
      : "",
    payload.patientEmail
      ? `<tr><td style="padding:8px 12px;color:#64748b;">Email</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(payload.patientEmail)}</td></tr>`
      : "",
  ].join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#0f172a;">
      <h1 style="font-size:20px;color:#26767f;margin:0 0 16px;">New appointment request</h1>
      <p style="color:#475569;line-height:1.5;">A booking was submitted through the doctor profile page.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:8px 12px;color:#64748b;">Doctor</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(payload.doctorName)}</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">Date</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(payload.dayLabel)}</td></tr>
        <tr><td style="padding:8px 12px;color:#64748b;">Time</td><td style="padding:8px 12px;font-weight:600;">${escapeHtml(payload.timeLabel)}</td></tr>
        ${patientRows}
      </table>
      <p style="font-size:12px;color:#94a3b8;">Doctor ID: ${escapeHtml(payload.doctorId)} · Slot: ${escapeHtml(payload.slotKey)}</p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAppointmentEmail(
  payload: AppointmentEmailPayload,
): Promise<SendAppointmentEmailResult> {
  const to = getAppointmentNotifyEmail();
  const subject = buildSubject(payload);
  const text = buildPlainText(payload);
  const html = buildHtml(payload);

  if (!isResendConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[appointment-email] Preview (RESEND_API_KEY not set):", {
        to,
        from: getEmailFromAddress(),
        subject,
        text,
      });
      return { ok: true, mode: "preview" };
    }

    return {
      ok: false,
      error:
        "Email delivery is not configured. Set RESEND_API_KEY in .env.local.",
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to: [to],
    subject,
    text,
    html,
  });

  if (error) {
    console.error("[appointment-email] Resend error:", error);
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "Email provider did not return a message id." };
  }

  return { ok: true, mode: "resend", id: data.id };
}
