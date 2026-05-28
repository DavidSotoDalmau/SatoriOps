import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  returnTo: z.string().default("/dashboard"),
});

export const topicSchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().min(3).max(120),
  area: z.string().min(2).max(80),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueDate: z.string().optional(),
  description: z.string().max(4000).optional().or(z.literal("")),
  returnTo: z.string().default("/topics"),
});

export const topicUpdateSchema = z.object({
  topicId: z.string().cuid(),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().max(4000).optional().or(z.literal("")),
  returnTo: z.string().default("/topics"),
});

export const topicKanbanMoveSchema = z.object({
  topicId: z.string().cuid(),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
});

export const taskSchema = z.object({
  topicId: z.string().cuid(),
  title: z.string().min(3).max(120),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueDate: z.string().optional(),
  description: z.string().max(4000).optional().or(z.literal("")),
  returnTo: z.string().default("/topics"),
});

export const taskUpdateSchema = z.object({
  taskId: z.string().cuid(),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  returnTo: z.string().default("/topics"),
});

export const decisionSchema = z.object({
  eventId: z.string().cuid(),
  topicId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().min(3).max(120),
  summary: z.string().min(10).max(3000),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  returnTo: z.string().default("/decisions"),
});

export const decisionUpdateSchema = z.object({
  decisionId: z.string().cuid(),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  summary: z.string().min(10).max(3000),
  returnTo: z.string().default("/decisions"),
});

export const commentSchema = z.object({
  topicId: z.string().cuid(),
  taskId: z.string().cuid().optional().or(z.literal("")),
  body: z.string().min(1).max(2000),
  returnTo: z.string().default("/topics"),
});

export const settingsSchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  returnTo: z.string().default("/settings"),
});

export const membershipRoleSchema = z.object({
  membershipId: z.string().cuid(),
  role: z.enum(["OWNER", "ORGANIZER", "CONTRIBUTOR", "VIEWER"]),
  returnTo: z.string().default("/people"),
});

export const membershipDeactivationSchema = z.object({
  membershipId: z.string().cuid(),
  returnTo: z.string().default("/people"),
});

export const eventStatusUpdateSchema = z.object({
  eventId: z.string().cuid(),
  status: z.enum(["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]),
  returnTo: z.string().default("/dashboard"),
});

export const topicDeletionSchema = z.object({
  topicId: z.string().cuid(),
  returnTo: z.string().default("/topics"),
});

export const taskDeletionSchema = z.object({
  taskId: z.string().cuid(),
  returnTo: z.string().default("/topics"),
});

export const decisionDeletionSchema = z.object({
  decisionId: z.string().cuid(),
  returnTo: z.string().default("/decisions"),
});
