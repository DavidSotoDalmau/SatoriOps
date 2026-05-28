"use server";

import { signOut } from "@/auth";

export async function performSignOut() {
  await signOut({
    redirectTo: "/",
  });
}
