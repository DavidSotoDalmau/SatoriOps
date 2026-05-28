import {
  createComment,
  createDecision,
  createTask,
  deleteTask,
  deleteTopic,
  updateTask,
  updateTopic,
} from "@/app/(app)/actions";
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

type TopicDetailPageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const membership = await requireMembership();
  const { locale, t } = await getTranslations();
  const { topicId } = await params;
  const topic = await db.topic.findFirst({
    where: {
      id: topicId,
      event: { organizationId: membership.organizationId },
    },
    include: {
      owner: { include: { user: true } },
      event: true,
      tasks: { orderBy: { createdAt: "desc" } },
      comments: { include: { author: { include: { user: true } } }, orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { createdAt: "desc" } },
      dependenciesFrom: { include: { blockingTopic: true } },
    },
  });

  if (!topic) {
    return <p className="text-sm text-slate-300">{t.common.noData}</p>;
  }

  const returnTo = `/topics/${topic.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{translateArea(locale, topic.area)}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{topic.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {t.common.owner}: {topic.owner?.user.name ?? t.common.unassigned} · {t.common.lastUpdate}: {topic.updatedAt.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{translateStatus(locale, topic.status)}</Badge>
          <Badge variant="muted">{translatePriority(locale, topic.priority)}</Badge>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.topics.topicDetails}</CardTitle></CardHeader>
          <CardContent>
            <form action={updateTopic} className="space-y-4">
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">{t.common.status}</Label>
                  <Select id="status" name="status" defaultValue={topic.status}>
                    {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">{t.common.priority}</Label>
                  <Select id="priority" name="priority" defaultValue={topic.priority}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{translatePriority(locale, priority)}</option>)}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.common.description}</Label>
                <Textarea id="description" name="description" defaultValue={topic.description ?? ""} />
              </div>
              <Button type="submit">{t.pages.topics.saveTopic}</Button>
            </form>
            {(membership.role === "OWNER" || membership.role === "ORGANIZER") ? (
              <form action={deleteTopic} className="mt-3">
                <input type="hidden" name="topicId" value={topic.id} />
                <input type="hidden" name="returnTo" value="/topics" />
                <Button type="submit" variant="outline">{t.pages.topics.deleteTopic}</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.topics.blockersAndDependencies}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topic.dependenciesFrom.length === 0 ? (
              <p className="text-sm text-slate-400">{t.common.noData}</p>
            ) : (
              topic.dependenciesFrom.map((dependency) => (
                <div key={dependency.id} className="rounded-2xl border border-white/10 p-3">
                  <p className="font-medium text-white">{dependency.blockingTopic.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{dependency.note ?? "Dependency without note."}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.topics.tasks}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topic.tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{task.title}</p>
                  <Badge>{translateStatus(locale, task.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-300">{task.description}</p>
                <form action={updateTask} className="mt-3 flex flex-wrap gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Select name="status" defaultValue={task.status} className="max-w-44">
                    {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
                  </Select>
                  <Select name="priority" defaultValue={task.priority} className="max-w-44">
                    {priorities.map((priority) => <option key={priority} value={priority}>{translatePriority(locale, priority)}</option>)}
                  </Select>
                  <Button type="submit">{t.common.update}</Button>
                </form>
                <form action={deleteTask} className="mt-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="outline">{t.common.delete}</Button>
                </form>
              </div>
            ))}

            <form action={createTask} className="space-y-3 rounded-2xl border border-white/10 p-4">
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <p className="font-medium text-white">{t.pages.topics.createTask}</p>
              <Input name="title" placeholder={t.common.title} required />
              <div className="grid gap-3 md:grid-cols-2">
                <Select name="status" defaultValue="IDEA">
                  {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
                </Select>
                <Select name="priority" defaultValue="MEDIUM">
                  {priorities.map((priority) => <option key={priority} value={priority}>{translatePriority(locale, priority)}</option>)}
                </Select>
              </div>
              <Input name="dueDate" type="date" />
              <Textarea name="description" placeholder={t.pages.topics.taskDescription} />
              <Button type="submit">{t.pages.topics.createTask}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.topics.commentsAndDecisions}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={createComment} className="space-y-3 rounded-2xl border border-white/10 p-4">
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <p className="font-medium text-white">{t.pages.topics.addComment}</p>
              <Textarea name="body" placeholder={t.pages.topics.commentPlaceholder} required />
              <Button type="submit">{t.pages.topics.addComment}</Button>
            </form>

            {topic.comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm font-medium text-white">{comment.author.user.name ?? comment.author.user.email}</p>
                <p className="mt-2 text-sm text-slate-300">{comment.body}</p>
              </div>
            ))}

            <form action={createDecision} className="space-y-3 rounded-2xl border border-white/10 p-4">
              <input type="hidden" name="eventId" value={topic.eventId} />
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <p className="font-medium text-white">{t.pages.topics.createDecision}</p>
              <Input name="title" placeholder={t.common.title} required />
              <Select name="status" defaultValue="PLANNED">
                {statuses.map((status) => <option key={status} value={status}>{translateStatus(locale, status)}</option>)}
              </Select>
              <Textarea name="summary" placeholder={t.pages.topics.decisionSummary} required />
              <Button type="submit">{t.pages.topics.createDecision}</Button>
            </form>

            {topic.decisions.map((decision) => (
              <div key={decision.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{decision.title}</p>
                  <Badge>{translateStatus(locale, decision.status)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{decision.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
