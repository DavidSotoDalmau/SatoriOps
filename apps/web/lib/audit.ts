import { db } from "@/lib/db";

type AuditInput = {
  organizationId: string;
  actorUserId?: string | null;
  actorMembershipId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  eventId?: string | null;
  topicId?: string | null;
  taskId?: string | null;
  decisionId?: string | null;
  isSensitive?: boolean;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      actorMembershipId: input.actorMembershipId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      eventId: input.eventId ?? null,
      topicId: input.topicId ?? null,
      taskId: input.taskId ?? null,
      decisionId: input.decisionId ?? null,
      isSensitive: input.isSensitive ?? false,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
