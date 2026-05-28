"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError, toPublicErrorMessage } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validators/auth";

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/change-password?error=invalid_input");
  }

  const limiter = checkRateLimit(`password-change:${user.id}`, 10, 15 * 60 * 1000);
  if (!limiter.allowed) {
    redirect("/change-password?error=rate_limited");
  }

  try {
    if (!user.passwordHash) {
      throw new AppError("This account cannot change password with credentials.");
    }

    const passwordMatches = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("The current password is not valid.");
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(parsed.data.newPassword, 12),
        mustChangePassword: false,
      },
    });

    const membership = await db.membership.findFirst({
      where: {
        userId: updatedUser.id,
        active: true,
      },
    });

    if (membership) {
      await createAuditLog({
        organizationId: membership.organizationId,
        actorUserId: updatedUser.id,
        actorMembershipId: membership.id,
        action: "user.password.changed",
        entityType: "User",
        entityId: updatedUser.id,
        isSensitive: true,
      });
    }
  } catch (error) {
    redirect(`/change-password?error=${encodeURIComponent(toPublicErrorMessage(error))}`);
  }

  redirect("/dashboard");
}
