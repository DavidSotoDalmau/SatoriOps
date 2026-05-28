"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, localeCookieName } from "@/lib/i18n";

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/");

  if (!isLocale(locale)) {
    redirect(returnTo);
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(returnTo.startsWith("/") ? returnTo : "/");
}
