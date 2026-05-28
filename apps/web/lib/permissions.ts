import type { Event, Membership, Role, Topic } from "@prisma/client";
import { db } from "@/lib/db";

const managementRoles: Role[] = ["OWNER", "ORGANIZER"];

export function canManageOrganization(role: Role) {
  return role === "OWNER";
}

export function canViewAuditLog(role: Role, isSensitive = false) {
  if (role === "OWNER") {
    return true;
  }

  if (role === "ORGANIZER") {
    return !isSensitive;
  }

  return false;
}

export function canCreateTopic(role: Role) {
  return managementRoles.includes(role) || role === "CONTRIBUTOR";
}

export function canDeleteTopic(role: Role) {
  return managementRoles.includes(role);
}

export function canCreateDecision(role: Role) {
  return role !== "VIEWER";
}

export function canManageEvent(role: Role) {
  return managementRoles.includes(role);
}

export function canReadEvent(role: Role) {
  return role === "OWNER" || role === "ORGANIZER" || role === "CONTRIBUTOR" || role === "VIEWER";
}

export function canUpdateTopic(membership: Membership, topic: Topic) {
  if (managementRoles.includes(membership.role)) {
    return true;
  }

  return membership.role === "CONTRIBUTOR" && topic.ownerId === membership.id;
}

export async function requireEventReadAccess(membership: Membership, eventId: string): Promise<Event> {
  const event = await db.event.findFirst({
    where: {
      id: eventId,
      organizationId: membership.organizationId,
    },
  });

  if (!event || !canReadEvent(membership.role)) {
    throw new Error("Unauthorized");
  }

  return event;
}
