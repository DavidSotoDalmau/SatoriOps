"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Role, Status } from "@prisma/client";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { AppError, toPublicErrorMessage } from "@/lib/errors";
import { generateSecureToken, generateTemporaryPassword, hashToken } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  canCreateDecision,
  canCreateTopic,
  canDeleteTopic,
  canManageEvent,
  canManageOrganization,
  canUpdateTopic,
} from "@/lib/permissions";
import { invitationSchema } from "@/lib/validators/auth";
import {
  commentSchema,
  decisionSchema,
  decisionDeletionSchema,
  decisionUpdateSchema,
  eventSchema,
  eventStatusUpdateSchema,
  membershipRoleSchema,
  membershipDeactivationSchema,
  settingsSchema,
  taskSchema,
  taskDeletionSchema,
  taskUpdateSchema,
  topicKanbanMoveSchema,
  topicDeletionSchema,
  topicSchema,
  topicUpdateSchema,
} from "@/lib/validators/domain";

function safeReturnTo(path: string, fallback: string) {
  return path.startsWith("/") ? path : fallback;
}

function fail(path: string, error: unknown): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(toPublicErrorMessage(error))}`);
}

function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new AppError("Too many requests. Please wait and try again.");
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const invitationShareCookieName = "satoriops-invitation-share";

async function setInvitationShareCookie(input: {
  email: string;
  temporaryPassword: string;
  token?: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(invitationShareCookieName, JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/invitations",
    maxAge: 60 * 5,
  });
}

export async function createInvitation(formData: FormData) {
  const membership = await requireMembership();
  const parsed = invitationSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/invitations"), "/invitations");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid invitation request."));
  }

  try {
    if (membership.role !== "OWNER" && membership.role !== "ORGANIZER") {
      throw new AppError("You do not have permission to invite users.");
    }

    if (membership.role === "ORGANIZER" && !["CONTRIBUTOR", "VIEWER"].includes(parsed.data.role)) {
      throw new AppError("Organizers may only invite contributors or viewers.");
    }

    enforceRateLimit(`invite:${membership.id}`, 20, 60 * 60 * 1000);

    const email = parsed.data.email.toLowerCase();
    const existingPending = await db.invitation.findFirst({
      where: {
        organizationId: membership.organizationId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPending) {
      throw new AppError("There is already an active invitation for this email.");
    }

    const rawToken = generateSecureToken(24);
    const temporaryPassword = generateTemporaryPassword();
    const invitation = await db.invitation.create({
      data: {
        organizationId: membership.organizationId,
        email,
        role: parsed.data.role,
        tokenHash: hashToken(rawToken),
        initialPasswordHash: await hash(temporaryPassword, 12),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedByUserId: membership.userId,
        invitedByMemberId: membership.id,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "invitation.created",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: {
        email,
        role: parsed.data.role,
      },
    });

    await setInvitationShareCookie({
      email,
      temporaryPassword,
      token: rawToken,
    });

    revalidatePath("/invitations");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function regenerateInvitationPassword(formData: FormData) {
  const membership = await requireMembership();
  const invitationId = String(formData.get("invitationId") ?? "");
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/invitations"), "/invitations");

  try {
    if (membership.role !== "OWNER" && membership.role !== "ORGANIZER") {
      throw new AppError("You do not have permission to manage invitations.");
    }

    if (!invitationId) {
      throw new AppError("Invalid invitation.");
    }

    enforceRateLimit(`invite-password:${membership.id}`, 30, 60 * 60 * 1000);

    const invitation = await db.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: membership.organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      throw new AppError("Invitation not found or no longer active.");
    }

    if (membership.role === "ORGANIZER" && !["CONTRIBUTOR", "VIEWER"].includes(invitation.role)) {
      throw new AppError("Organizers may only manage contributor or viewer invitations.");
    }

    const temporaryPassword = generateTemporaryPassword();

    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        initialPasswordHash: await hash(temporaryPassword, 12),
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "invitation.password_regenerated",
      entityType: "Invitation",
      entityId: invitation.id,
      isSensitive: true,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    await setInvitationShareCookie({
      email: invitation.email,
      temporaryPassword,
    });

    revalidatePath("/invitations");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function createEvent(formData: FormData) {
  const membership = await requireMembership();
  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/dashboard"), "/dashboard");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid event payload."));
  }

  try {
    if (!canManageEvent(membership.role)) {
      throw new AppError("You do not have permission to create events.");
    }

    enforceRateLimit(`event:${membership.id}`, 30, 60 * 1000);

    const event = await db.event.create({
      data: {
        organizationId: membership.organizationId,
        createdById: membership.id,
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description || null,
        status: parsed.data.status,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "event.created",
      entityType: "Event",
      entityId: event.id,
      eventId: event.id,
    });

    revalidatePath("/dashboard");
    redirect(`/events/${event.id}`);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateEventStatus(formData: FormData) {
  const membership = await requireMembership();
  const parsed = eventStatusUpdateSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/dashboard"), "/dashboard");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid event status payload."));
  }

  try {
    if (!canManageEvent(membership.role)) {
      throw new AppError("You do not have permission to update events.");
    }

    const event = await db.event.findFirst({
      where: { id: parsed.data.eventId, organizationId: membership.organizationId },
    });

    if (!event) {
      throw new AppError("Event not found.");
    }

    await db.event.update({
      where: { id: event.id },
      data: { status: parsed.data.status },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "event.updated",
      entityType: "Event",
      entityId: event.id,
      eventId: event.id,
      metadata: { status: parsed.data.status },
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function createTopic(formData: FormData) {
  const membership = await requireMembership();
  const parsed = topicSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    area: formData.get("area"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    description: formData.get("description"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid topic payload."));
  }

  try {
    if (!canCreateTopic(membership.role)) {
      throw new AppError("You do not have permission to create topics.");
    }

    const event = await db.event.findFirst({
      where: {
        id: parsed.data.eventId,
        organizationId: membership.organizationId,
      },
    });

    if (!event) {
      throw new AppError("Event not found.");
    }

    enforceRateLimit(`topic:${membership.id}`, 60, 60 * 1000);

    const topic = await db.topic.create({
      data: {
        eventId: event.id,
        ownerId: membership.id,
        createdById: membership.id,
        title: parsed.data.title,
        area: parsed.data.area,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        description: parsed.data.description || null,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "topic.created",
      entityType: "Topic",
      entityId: topic.id,
      eventId: event.id,
      topicId: topic.id,
    });

    revalidatePath("/topics");
    redirect(`/topics/${topic.id}`);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateTopic(formData: FormData) {
  const membership = await requireMembership();
  const parsed = topicUpdateSchema.safeParse({
    topicId: formData.get("topicId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    description: formData.get("description"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid topic update payload."));
  }

  try {
    const topic = await db.topic.findFirst({
      where: {
        id: parsed.data.topicId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!topic || !canUpdateTopic(membership, topic)) {
      throw new AppError("You do not have permission to update this topic.");
    }

    await db.topic.update({
      where: { id: topic.id },
      data: {
        status: parsed.data.status,
        priority: parsed.data.priority,
        description: parsed.data.description || null,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "topic.updated",
      entityType: "Topic",
      entityId: topic.id,
      topicId: topic.id,
      eventId: topic.eventId,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function deleteTopic(formData: FormData) {
  const membership = await requireMembership();
  const parsed = topicDeletionSchema.safeParse({
    topicId: formData.get("topicId"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid topic deletion payload."));
  }

  try {
    if (!canDeleteTopic(membership.role)) {
      throw new AppError("You do not have permission to delete topics.");
    }

    const topic = await db.topic.findFirst({
      where: {
        id: parsed.data.topicId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!topic) {
      throw new AppError("Topic not found.");
    }

    await db.topic.delete({ where: { id: topic.id } });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "topic.deleted",
      entityType: "Topic",
      entityId: topic.id,
      topicId: topic.id,
      eventId: topic.eventId,
    });

    revalidatePath("/topics");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function moveTopicKanban(input: { topicId: string; status: Status }) {
  const membership = await requireMembership();
  const parsed = topicKanbanMoveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid kanban move payload.",
    };
  }

  try {
    const topic = await db.topic.findFirst({
      where: {
        id: parsed.data.topicId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!topic || !canUpdateTopic(membership, topic)) {
      throw new AppError("You do not have permission to move this topic.");
    }

    if (topic.status === parsed.data.status) {
      return { ok: true };
    }

    enforceRateLimit(`kanban:${membership.id}`, 90, 60 * 1000);

    await db.topic.update({
      where: { id: topic.id },
      data: {
        status: parsed.data.status,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "topic.status_changed",
      entityType: "Topic",
      entityId: topic.id,
      topicId: topic.id,
      eventId: topic.eventId,
      metadata: {
        from: topic.status,
        to: parsed.data.status,
        surface: "kanban",
      },
    });

    revalidatePath("/kanban");
    revalidatePath("/dashboard");
    revalidatePath("/blockers");
    revalidatePath(`/topics/${topic.id}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error),
    };
  }
}

export async function createTask(formData: FormData) {
  const membership = await requireMembership();
  const parsed = taskSchema.safeParse({
    topicId: formData.get("topicId"),
    title: formData.get("title"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    description: formData.get("description"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid task payload."));
  }

  try {
    const topic = await db.topic.findFirst({
      where: {
        id: parsed.data.topicId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!topic || !canUpdateTopic(membership, topic)) {
      throw new AppError("You do not have permission to create tasks for this topic.");
    }

    const task = await db.task.create({
      data: {
        topicId: topic.id,
        ownerId: membership.id,
        createdById: membership.id,
        title: parsed.data.title,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        description: parsed.data.description || null,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "task.created",
      entityType: "Task",
      entityId: task.id,
      eventId: topic.eventId,
      topicId: topic.id,
      taskId: task.id,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateTask(formData: FormData) {
  const membership = await requireMembership();
  const parsed = taskUpdateSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid task update payload."));
  }

  try {
    const task = await db.task.findFirst({
      where: {
        id: parsed.data.taskId,
        topic: {
          event: { organizationId: membership.organizationId },
        },
      },
      include: { topic: true },
    });

    if (!task) {
      throw new AppError("Task not found.");
    }

    const allowed =
      membership.role === "OWNER" ||
      membership.role === "ORGANIZER" ||
      task.ownerId === membership.id;

    if (!allowed) {
      throw new AppError("You do not have permission to update this task.");
    }

    await db.task.update({
      where: { id: task.id },
      data: {
        status: parsed.data.status,
        priority: parsed.data.priority,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "task.updated",
      entityType: "Task",
      entityId: task.id,
      eventId: task.topic.eventId,
      topicId: task.topicId,
      taskId: task.id,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function deleteTask(formData: FormData) {
  const membership = await requireMembership();
  const parsed = taskDeletionSchema.safeParse({
    taskId: formData.get("taskId"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid task deletion payload."));
  }

  try {
    const task = await db.task.findFirst({
      where: {
        id: parsed.data.taskId,
        topic: {
          event: { organizationId: membership.organizationId },
        },
      },
      include: { topic: true },
    });

    if (!task) {
      throw new AppError("Task not found.");
    }

    const allowed =
      membership.role === "OWNER" ||
      membership.role === "ORGANIZER" ||
      task.ownerId === membership.id;

    if (!allowed) {
      throw new AppError("You do not have permission to delete this task.");
    }

    await db.task.delete({ where: { id: task.id } });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "task.deleted",
      entityType: "Task",
      entityId: task.id,
      eventId: task.topic.eventId,
      topicId: task.topicId,
      taskId: task.id,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function createDecision(formData: FormData) {
  const membership = await requireMembership();
  const parsed = decisionSchema.safeParse({
    eventId: formData.get("eventId"),
    topicId: formData.get("topicId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/decisions"), "/decisions");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid decision payload."));
  }

  try {
    if (!canCreateDecision(membership.role)) {
      throw new AppError("You do not have permission to create decisions.");
    }

    const event = await db.event.findFirst({
      where: {
        id: parsed.data.eventId,
        organizationId: membership.organizationId,
      },
    });

    if (!event) {
      throw new AppError("Event not found.");
    }

    const decision = await db.decision.create({
      data: {
        eventId: event.id,
        topicId: parsed.data.topicId || null,
        createdById: membership.id,
        title: parsed.data.title,
        summary: parsed.data.summary,
        status: parsed.data.status,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "decision.created",
      entityType: "Decision",
      entityId: decision.id,
      eventId: event.id,
      topicId: decision.topicId,
      decisionId: decision.id,
    });

    revalidatePath("/decisions");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateDecision(formData: FormData) {
  const membership = await requireMembership();
  const parsed = decisionUpdateSchema.safeParse({
    decisionId: formData.get("decisionId"),
    status: formData.get("status"),
    summary: formData.get("summary"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/decisions"), "/decisions");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid decision update payload."));
  }

  try {
    const decision = await db.decision.findFirst({
      where: {
        id: parsed.data.decisionId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!decision) {
      throw new AppError("Decision not found.");
    }

    const allowed =
      membership.role === "OWNER" ||
      membership.role === "ORGANIZER" ||
      (membership.role === "CONTRIBUTOR" && decision.createdById === membership.id);

    if (!allowed) {
      throw new AppError("You do not have permission to update this decision.");
    }

    await db.decision.update({
      where: { id: decision.id },
      data: {
        status: parsed.data.status,
        summary: parsed.data.summary,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "decision.updated",
      entityType: "Decision",
      entityId: decision.id,
      eventId: decision.eventId,
      topicId: decision.topicId,
      decisionId: decision.id,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function deleteDecision(formData: FormData) {
  const membership = await requireMembership();
  const parsed = decisionDeletionSchema.safeParse({
    decisionId: formData.get("decisionId"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/decisions"), "/decisions");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid decision deletion payload."));
  }

  try {
    const decision = await db.decision.findFirst({
      where: {
        id: parsed.data.decisionId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!decision) {
      throw new AppError("Decision not found.");
    }

    const allowed =
      membership.role === "OWNER" ||
      membership.role === "ORGANIZER" ||
      (membership.role === "CONTRIBUTOR" && decision.createdById === membership.id);

    if (!allowed) {
      throw new AppError("You do not have permission to delete this decision.");
    }

    await db.decision.delete({ where: { id: decision.id } });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "decision.deleted",
      entityType: "Decision",
      entityId: decision.id,
      eventId: decision.eventId,
      topicId: decision.topicId,
      decisionId: decision.id,
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function createComment(formData: FormData) {
  const membership = await requireMembership();
  const parsed = commentSchema.safeParse({
    topicId: formData.get("topicId"),
    taskId: formData.get("taskId"),
    body: formData.get("body"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/topics"), "/topics");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid comment payload."));
  }

  try {
    if (membership.role === "VIEWER") {
      throw new AppError("Viewers cannot add comments.");
    }

    const topic = await db.topic.findFirst({
      where: {
        id: parsed.data.topicId,
        event: { organizationId: membership.organizationId },
      },
    });

    if (!topic) {
      throw new AppError("Topic not found.");
    }

    await db.comment.create({
      data: {
        topicId: topic.id,
        taskId: parsed.data.taskId || null,
        authorId: membership.id,
        body: parsed.data.body,
      },
    });

    revalidatePath(returnTo);
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateMemberRole(formData: FormData) {
  const membership = await requireMembership();
  const parsed = membershipRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/people"), "/people");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid role update payload."));
  }

  try {
    if (!canManageOrganization(membership.role)) {
      throw new AppError("You do not have permission to change roles.");
    }

    const targetMembership = await db.membership.findFirst({
      where: {
        id: parsed.data.membershipId,
        organizationId: membership.organizationId,
      },
    });

    if (!targetMembership) {
      throw new AppError("Membership not found.");
    }

    if (targetMembership.role === Role.OWNER && parsed.data.role !== "OWNER") {
      const ownerCount = await db.membership.count({
        where: {
          organizationId: membership.organizationId,
          role: Role.OWNER,
          active: true,
        },
      });

      if (ownerCount <= 1) {
        throw new AppError("You cannot remove the last owner.");
      }
    }

    await db.membership.update({
      where: { id: targetMembership.id },
      data: { role: parsed.data.role },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "member.role_changed",
      entityType: "Membership",
      entityId: targetMembership.id,
      isSensitive: true,
      metadata: {
        from: targetMembership.role,
        to: parsed.data.role,
      },
    });

    revalidatePath("/people");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function deactivateMember(formData: FormData) {
  const membership = await requireMembership();
  const parsed = membershipDeactivationSchema.safeParse({
    membershipId: formData.get("membershipId"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/people"), "/people");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid member removal payload."));
  }

  try {
    if (!canManageOrganization(membership.role)) {
      throw new AppError("You do not have permission to remove members.");
    }

    const targetMembership = await db.membership.findFirst({
      where: {
        id: parsed.data.membershipId,
        organizationId: membership.organizationId,
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (!targetMembership) {
      throw new AppError("Membership not found.");
    }

    if (targetMembership.id === membership.id) {
      throw new AppError("You cannot remove your own access from this screen.");
    }

    if (targetMembership.role === Role.OWNER) {
      const ownerCount = await db.membership.count({
        where: {
          organizationId: membership.organizationId,
          role: Role.OWNER,
          active: true,
        },
      });

      if (ownerCount <= 1) {
        throw new AppError("You cannot remove the last owner.");
      }
    }

    await db.membership.update({
      where: { id: targetMembership.id },
      data: { active: false },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "member.deactivated",
      entityType: "Membership",
      entityId: targetMembership.id,
      isSensitive: true,
      metadata: {
        email: targetMembership.user.email,
        role: targetMembership.role,
      },
    });

    revalidatePath("/people");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}

export async function updateOrganizationSettings(formData: FormData) {
  const membership = await requireMembership();
  const parsed = settingsSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    description: formData.get("description"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/settings"), "/settings");

  if (!parsed.success) {
    fail(returnTo, new AppError("Invalid organization settings payload."));
  }

  try {
    if (!canManageOrganization(membership.role) || membership.organizationId !== parsed.data.organizationId) {
      throw new AppError("You do not have permission to change organization settings.");
    }

    await db.organization.update({
      where: { id: parsed.data.organizationId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      actorMembershipId: membership.id,
      action: "organization.settings_changed",
      entityType: "Organization",
      entityId: parsed.data.organizationId,
      isSensitive: true,
    });

    revalidatePath("/settings");
    redirect(returnTo);
  } catch (error) {
    fail(returnTo, error);
  }
}
