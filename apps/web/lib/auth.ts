import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireMembership(organizationSlug?: string) {
  const user = await requireUser();

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      active: true,
      organization: organizationSlug
        ? {
            slug: organizationSlug,
          }
        : undefined,
    },
    include: {
      organization: true,
      user: true,
    },
  });

  if (!membership) {
    redirect("/login");
  }

  return membership;
}

export async function requireRole(roles: Role[], organizationSlug?: string) {
  const membership = await requireMembership(organizationSlug);

  if (!roles.includes(membership.role)) {
    redirect("/dashboard");
  }

  return membership;
}
