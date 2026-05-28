"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";

export async function authenticate(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_input");
  }

  const limiter = checkRateLimit(`login:${parsed.data.email.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!limiter.allowed) {
    redirect("/login?error=rate_limited");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid_credentials");
    }

    throw error;
  }
}
