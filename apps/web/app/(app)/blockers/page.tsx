import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { translateStatus } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BlockersPage() {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const blockedTopics = await db.topic.findMany({
    where: {
      event: { organizationId: membership.organizationId },
      OR: [{ status: "BLOCKED" }, { dependenciesFrom: { some: {} } }],
    },
    include: {
      dependenciesFrom: { include: { blockingTopic: true } },
      owner: { include: { user: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.blockers.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.blockers.title}</h1>
      </div>
      {blockedTopics.map((topic) => (
        <Card key={topic.id} className="border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                <Link href={`/topics/${topic.id}`}>{topic.title}</Link>
              </CardTitle>
                <Badge variant="danger">{translateStatus(locale, topic.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-300">{t.common.owner}: {topic.owner?.user.name ?? t.common.unassigned}</p>
            {topic.dependenciesFrom.map((dependency) => (
              <div key={dependency.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
                {t.pages.blockers.dependsOn} <span className="text-white">{dependency.blockingTopic.title}</span>
                {dependency.note ? ` - ${dependency.note}` : ""}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
