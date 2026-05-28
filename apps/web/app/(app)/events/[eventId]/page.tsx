import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth";
import { updateEventStatus } from "@/app/(app)/actions";
import { translateStatus } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { statuses } from "@/lib/ui-options";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const { eventId } = await params;
  const event = await db.event.findFirst({
    where: { id: eventId, organizationId: membership.organizationId },
    include: {
      topics: { orderBy: { updatedAt: "desc" } },
      decisions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!event) {
    return <p className="text-sm text-slate-300">{t.common.noData}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.event.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{event.name}</h1>
        </div>
        <Badge>{translateStatus(locale, event.status)}</Badge>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader><CardTitle className="text-white">{t.pages.dashboard.eventStatus}</CardTitle></CardHeader>
        <CardContent>
          <form action={updateEventStatus} className="flex gap-3">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="returnTo" value={`/events/${event.id}`} />
            <Select name="status" defaultValue={event.status}>
              {statuses.map((status) => (
                <option key={status} value={status}>{translateStatus(locale, status)}</option>
              ))}
            </Select>
            <Button type="submit">{t.common.update}</Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.event.topics}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {event.topics.map((topic) => (
              <a key={topic.id} href={`/topics/${topic.id}`} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                <span>{topic.title}</span>
                <Badge>{translateStatus(locale, topic.status)}</Badge>
              </a>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.event.latestDecisions}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {event.decisions.map((decision) => (
              <div key={decision.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="font-medium text-white">{decision.title}</p>
                <p className="mt-1 text-sm text-slate-300">{decision.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
