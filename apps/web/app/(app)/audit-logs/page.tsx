import { requireMembership } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n-server";
import { canViewAuditLog } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditLogsPage() {
  const membership = await requireMembership();
  const { t } = await getTranslations();

  if (!canViewAuditLog(membership.role)) {
    return <p className="text-sm text-slate-300">{t.pages.auditLogs.denied}</p>;
  }

  const auditLogs = await db.auditLog.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(membership.role === "ORGANIZER" ? { isSensitive: false } : {}),
    },
    include: { actorUser: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.auditLogs.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.auditLogs.title}</h1>
      </div>
      <div className="space-y-4">
        {auditLogs.map((log) => (
          <Card key={log.id} className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-white">{log.action}</CardTitle>
                <Badge variant={log.isSensitive ? "danger" : "muted"}>{log.entityType}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>{t.pages.auditLogs.entity}: {log.entityId}</p>
              <p>{t.pages.auditLogs.actor}: {log.actorUser?.email ?? "system"}</p>
              <p>{t.pages.auditLogs.at}: {log.createdAt.toLocaleString()}</p>
              {log.metadata ? <p>{t.pages.auditLogs.metadata}: {log.metadata}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
