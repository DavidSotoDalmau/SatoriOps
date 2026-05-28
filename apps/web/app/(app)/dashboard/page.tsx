import Link from "next/link";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth";
import { createEvent } from "@/app/(app)/actions";
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

export default async function DashboardPage() {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const [events, topics, blockedTopics, decisions, members] = await Promise.all([
    db.event.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    db.topic.findMany({
      where: { event: { organizationId: membership.organizationId } },
    }),
    db.topic.findMany({
      where: { event: { organizationId: membership.organizationId }, status: "BLOCKED" },
    }),
    db.decision.count({
      where: { event: { organizationId: membership.organizationId } },
    }),
    db.membership.count({
      where: { organizationId: membership.organizationId, active: true },
    }),
  ]);

  const firstEvent = events[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.dashboard.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.dashboard.title}</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-sm text-slate-300">{t.pages.dashboard.events}</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{events.length}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-sm text-slate-300">{t.pages.dashboard.topics}</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{topics.length}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-sm text-slate-300">{t.pages.dashboard.blocked}</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{blockedTopics.length}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-sm text-slate-300">{t.pages.dashboard.members}</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{members}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{t.pages.dashboard.activeEvents}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 hover:border-cyan-400/30"
              >
                <span>{event.name}</span>
                <Badge>{translateStatus(locale, event.status)}</Badge>
              </Link>
            ))}
            {events.length === 0 ? <p className="text-sm text-slate-400">{t.common.noData}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{t.pages.dashboard.createEvent}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEvent} className="space-y-3">
              <input type="hidden" name="returnTo" value="/dashboard" />
              <div className="space-y-2">
                <Label htmlFor="name">{t.common.name}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t.common.status}</Label>
                <Select id="status" name="status" defaultValue="PLANNED">
                  {statuses.map((status) => (
                    <option key={status} value={status}>{translateStatus(locale, status)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.common.description}</Label>
                <Textarea id="description" name="description" />
              </div>
              <Button type="submit" className="w-full">{t.pages.dashboard.createEvent}</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.dashboard.blockedTopics}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {blockedTopics.slice(0, 5).map((topic) => (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="block text-sm text-slate-300 hover:text-white">
                {topic.title}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.dashboard.decisions}</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{decisions}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.dashboard.quickLinks}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/topics" className="text-cyan-300 hover:text-cyan-200">{t.pages.dashboard.openTopics}</Link>
            <Link href="/kanban" className="text-cyan-300 hover:text-cyan-200">{t.pages.dashboard.openKanban}</Link>
            <Link href="/invitations" className="text-cyan-300 hover:text-cyan-200">{t.pages.dashboard.manageInvitations}</Link>
            {firstEvent ? <Link href={`/events/${firstEvent.id}`} className="text-cyan-300 hover:text-cyan-200">{t.pages.dashboard.latestEvent}</Link> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
