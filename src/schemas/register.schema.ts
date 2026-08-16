import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Required")
  .max(50, "Must be at most 50 characters")
  .regex(/^[a-zA-Z]+$/, "Letters only");

const userNameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be at most 50 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(255, "Password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character");

const registerBaseSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  userName: userNameSchema,
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm your password"),
});

export const registerDetailsSchema = registerBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

export type RegisterDetailsFormData = z.infer<typeof registerBaseSchema>;

export function toRegisterPayload(data: RegisterDetailsFormData) {
  const { confirmPassword: _confirmPassword, ...payload } = data;
  return payload;
}
