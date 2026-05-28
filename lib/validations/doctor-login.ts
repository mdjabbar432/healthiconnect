import { z } from "zod";

export const doctorLoginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type DoctorLoginFormValues = z.infer<typeof doctorLoginFormSchema>;
