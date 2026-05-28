"use server";

import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { AppError, toPublicErrorMessage } from "@/lib/errors";
import { hashToken } from "@/lib/crypto";
import { acceptInvitationSchema } from "@/lib/validators/auth";

export async function acceptInvitation(formData: FormData) {
  const parsed = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/accept-invitation?error=invalid_input");
  }

  try {
    const invitation = await db.invitation.findUnique({
      where: {
        tokenHash: hashToken(parsed.data.token),
      },
    });

    if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
      throw new AppError("This invitation is invalid or has expired.");
    }

    if (invitation.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
      throw new AppError("This invitation does not match the provided email.");
    }

    let user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (user) {
      const activeMembership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId,
          },
        },
      });

      if (activeMembership?.active) {
        throw new AppError("This user already belongs to the organization.");
      }

      if (!invitation.initialPasswordHash) {
        throw new AppError("This invitation is missing its initial password. Create a new invitation.");
      }

      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: user.name || parsed.data.name.trim(),
          passwordHash: invitation.initialPasswordHash,
          mustChangePassword: true,
        },
      });
    } else {
      if (!invitation.initialPasswordHash) {
        throw new AppError("This invitation is missing its initial password. Create a new invitation.");
      }

      user = await db.user.create({
        data: {
          name: parsed.data.name.trim(),
          email: parsed.data.email.toLowerCase(),
          passwordHash: invitation.initialPasswordHash,
          mustChangePassword: true,
        },
      });
    }

    const existingMembership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      },
    });

    const membership = existingMembership
      ? await db.membership.update({
          where: { id: existingMembership.id },
          data: {
            active: true,
            role: invitation.role,
          },
        })
      : await db.membership.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        });

    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        acceptedByUserId: user.id,
      },
    });

    await createAuditLog({
      organizationId: invitation.organizationId,
      actorUserId: user.id,
      actorMembershipId: membership.id,
      action: "invitation.accepted",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: {
        email: user.email,
        role: membership.role,
      },
    });
  } catch (error) {
    redirect(`/accept-invitation?error=${encodeURIComponent(toPublicErrorMessage(error))}`);
  }

  redirect("/login");
}
