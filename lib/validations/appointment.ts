import { z } from "zod";

export const confirmAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  doctorName: z.string().min(1).max(200),
  dayLabel: z.string().min(1).max(80),
  timeLabel: z.string().min(1).max(40),
  slotKey: z.string().min(1).max(40),
  patientName: z.string().min(1).max(120).optional(),
  patientEmail: z.string().email().optional(),
});

export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
