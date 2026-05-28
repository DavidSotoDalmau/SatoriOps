import { createDecision, deleteDecision, updateDecision } from "@/app/(app)/actions";
import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { translateStatus } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { statuses } from "@/lib/ui-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function DecisionsPage() {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const [events, topics, decisions] = await Promise.all([
    db.event.findMany({ where: { organizationId: membership.organizationId }, orderBy: { createdAt: "desc" } }),
    db.topic.findMany({ where: { event: { organizationId: membership.organizationId } }, orderBy: { title: "asc" } }),
    db.decision.findMany({
      where: { event: { organizationId: membership.organizationId } },
      include: { topic: true, event: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.decisions.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.decisions.title}</h1>
        </div>
        {decisions.map((decision) => (
          <Card key={decision.id} className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-white">{decision.title}</CardTitle>
                <Badge>{translateStatus(locale, decision.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">{decision.summary}</p>
              <p className="text-xs text-slate-400">{decision.event.name}{decision.topic ? ` · ${decision.topic.title}` : ""}</p>
              <form action={updateDecision} className="space-y-3">
                <input type="hidden" name="decisionId" value={decision.id} />
                <input type="hidden" name="returnTo" value="/decisions" />
                <Select name="status" defaultValue={decision.status}>
                  {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
                </Select>
                <Textarea name="summary" defaultValue={decision.summary} />
                <Button type="submit">{t.common.update}</Button>
              </form>
              <form action={deleteDecision} className="mt-3">
                <input type="hidden" name="decisionId" value={decision.id} />
                <input type="hidden" name="returnTo" value="/decisions" />
                <Button type="submit" variant="outline">{t.common.delete}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="h-fit border-white/10 bg-white/5">
        <CardHeader><CardTitle className="text-white">{t.pages.decisions.createDecision}</CardTitle></CardHeader>
        <CardContent>
          <form action={createDecision} className="space-y-3">
            <input type="hidden" name="returnTo" value="/decisions" />
            <div className="space-y-2">
              <Label htmlFor="eventId">{t.common.event}</Label>
              <Select id="eventId" name="eventId">
                {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topicId">{t.pages.topics.eyebrow}</Label>
              <Select id="topicId" name="topicId" defaultValue="">
                <option value="">{t.common.noLinkedTopic}</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
              </Select>
            </div>
            <Input name="title" placeholder={t.common.title} required />
            <Select name="status" defaultValue="PLANNED">
              {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
            </Select>
            <Textarea name="summary" placeholder={t.pages.topics.decisionSummary} required />
            <Button type="submit" className="w-full">{t.pages.decisions.createDecision}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
