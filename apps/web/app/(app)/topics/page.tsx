import Link from "next/link";
import { createTopic } from "@/app/(app)/actions";
import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { translateArea, translatePriority, translateStatus } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { priorities, statuses } from "@/lib/ui-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function TopicsPage() {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const [events, topics] = await Promise.all([
    db.event.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    db.topic.findMany({
      where: { event: { organizationId: membership.organizationId } },
      include: { owner: { include: { user: true } }, event: true, tasks: true, dependenciesFrom: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.topics.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.topics.title}</h1>
        </div>
        {topics.map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-medium text-white">{topic.title}</p>
                <p className="mt-1 text-sm text-slate-300">{translateArea(locale, topic.area)} · {topic.event.name}</p>
              </div>
              <Badge>{translateStatus(locale, topic.status)}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="muted">{t.common.owner}: {topic.owner?.user.name ?? t.common.unassigned}</Badge>
              <Badge variant="muted">{t.common.priority}: {translatePriority(locale, topic.priority)}</Badge>
              <Badge variant="muted">{t.pages.topics.tasks}: {topic.tasks.length}</Badge>
              <Badge variant={topic.dependenciesFrom.length > 0 ? "danger" : "muted"}>
                {t.common.blockers}: {topic.dependenciesFrom.length}
              </Badge>
            </div>
          </Link>
        ))}
      </section>

      <Card className="h-fit border-white/10 bg-white/5">
        <CardHeader><CardTitle className="text-white">{t.pages.topics.createTopic}</CardTitle></CardHeader>
        <CardContent>
          <form action={createTopic} className="space-y-3">
            <input type="hidden" name="returnTo" value="/topics" />
            <div className="space-y-2">
              <Label htmlFor="eventId">{t.common.event}</Label>
              <Select id="eventId" name="eventId">
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">{t.common.title}</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">{t.common.area}</Label>
              <Input id="area" name="area" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">{t.common.status}</Label>
                <Select id="status" name="status" defaultValue="IDEA">
                  {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t.common.priority}</Label>
                <Select id="priority" name="priority" defaultValue="MEDIUM">
                  {priorities.map((priority) => <option key={priority} value={priority}>{translatePriority(locale, priority)}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t.common.dueDate}</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t.common.description}</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">{t.pages.topics.createTopic}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
