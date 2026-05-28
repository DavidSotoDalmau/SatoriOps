import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(32),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  currentPassword: z.string().min(12).max(128).optional().or(z.literal("")),
});

export const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ORGANIZER", "CONTRIBUTOR", "VIEWER"]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(12).max(128),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  }

  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a new password different from the current one.",
      path: ["newPassword"],
    });
  }
});
