import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n-server";
import { KanbanBoard } from "@/components/kanban-board";

export default async function KanbanPage() {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const topics = await db.topic.findMany({
    where: { event: { organizationId: membership.organizationId } },
    include: { owner: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.kanban.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.kanban.title}</h1>
      </div>
      <KanbanBoard
        locale={locale}
        unassignedLabel={t.common.unassigned}
        initialTopics={topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          ownerName: topic.owner?.user.name ?? "",
          status: topic.status,
          canDrag:
            membership.role === "OWNER" ||
            membership.role === "ORGANIZER" ||
            (membership.role === "CONTRIBUTOR" && topic.ownerId === membership.id),
        }))}
      />
    </div>
  );
}
