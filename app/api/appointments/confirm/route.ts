import { NextResponse } from "next/server";
import { sendAppointmentEmail } from "@/lib/email/send-appointment-email";
import { confirmAppointmentSchema } from "@/lib/validations/appointment";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = confirmAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const emailResult = await sendAppointmentEmail(parsed.data);

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: "Failed to send appointment email", details: emailResult.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    emailSent: true,
    emailMode: emailResult.mode,
    appointment: {
      doctorId: parsed.data.doctorId,
      doctorName: parsed.data.doctorName,
      dayLabel: parsed.data.dayLabel,
      timeLabel: parsed.data.timeLabel,
      slotKey: parsed.data.slotKey,
    },
  });
}
