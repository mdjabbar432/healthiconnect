import { z } from "zod";

export const agentSignInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const agentSignUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  governmentId: z
    .string()
    .min(3, "Government ID must be at least 3 characters")
    .max(64, "Government ID is too long")
    .optional(),
});

export const agentRegistrationRequestSchema = agentSignUpSchema;

export const agentReferralCodeSchema = z
  .string()
  .trim()
  .min(3, "Agent ID must be at least 3 characters")
  .max(32, "Agent ID is too long")
  .regex(
    /^[A-Za-z0-9-]+$/,
    "Agent ID may only contain letters, numbers, and hyphens",
  );

export type AgentSignInValues = z.infer<typeof agentSignInSchema>;
export type AgentSignUpValues = z.infer<typeof agentSignUpSchema>;
