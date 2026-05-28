"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { moveTopicKanban } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n";
import { translateStatus } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type KanbanTopic = {
  id: string;
  title: string;
  ownerName: string;
  status: "IDEA" | "PLANNED" | "ACTIVE" | "BLOCKED" | "DONE" | "CANCELLED";
  canDrag: boolean;
};

const statusOrder = ["IDEA", "PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"] as const;

export function KanbanBoard({
  initialTopics,
  locale,
  unassignedLabel,
}: {
  initialTopics: KanbanTopic[];
  locale: Locale;
  unassignedLabel: string;
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<(typeof statusOrder)[number] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedTopics = useMemo(
    () =>
      statusOrder.reduce<Record<(typeof statusOrder)[number], KanbanTopic[]>>((accumulator, status) => {
        accumulator[status] = topics.filter((topic) => topic.status === status);
        return accumulator;
      }, {} as Record<(typeof statusOrder)[number], KanbanTopic[]>),
    [topics],
  );

  function handleDragStart(topicId: string, canDrag: boolean) {
    if (!canDrag || isPending) {
      return;
    }

    setDraggedTopicId(topicId);
    setErrorMessage(null);
  }

  function handleDrop(nextStatus: (typeof statusOrder)[number]) {
    if (!draggedTopicId) {
      return;
    }

    const previousTopics = topics;
    const draggedTopic = previousTopics.find((topic) => topic.id === draggedTopicId);

    setDraggedTopicId(null);
    setHoveredStatus(null);

    if (!draggedTopic || draggedTopic.status === nextStatus || !draggedTopic.canDrag) {
      return;
    }

    setTopics((currentTopics) =>
      currentTopics.map((topic) =>
        topic.id === draggedTopicId
          ? {
              ...topic,
              status: nextStatus,
            }
          : topic,
      ),
    );

    startTransition(async () => {
      const result = await moveTopicKanban({
        topicId: draggedTopicId,
        status: nextStatus,
      });

      if (!result.ok) {
        setTopics(previousTopics);
        setErrorMessage(result.message ?? "Unable to move this topic.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-6">
        {statusOrder.map((status) => (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              if (draggedTopicId) {
                setHoveredStatus(status);
              }
            }}
            onDragLeave={() => {
              if (hoveredStatus === status) {
                setHoveredStatus(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(status);
            }}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/5 p-3 transition",
              hoveredStatus === status ? "border-violet-300/35 bg-violet-400/8" : "",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{translateStatus(locale, status)}</h2>
              <Badge variant="muted">{groupedTopics[status].length}</Badge>
            </div>
            <div className="space-y-3">
              {groupedTopics[status].map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  draggable={topic.canDrag && !isPending}
                  onDragStart={() => handleDragStart(topic.id, topic.canDrag)}
                  onDragEnd={() => {
                    setDraggedTopicId(null);
                    setHoveredStatus(null);
                  }}
                  className={cn(
                    "block rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm transition",
                    topic.canDrag ? "cursor-grab active:cursor-grabbing hover:border-violet-300/20" : "cursor-default opacity-85",
                    draggedTopicId === topic.id ? "border-violet-300/35 bg-violet-400/10" : "",
                  )}
                >
                  <p className="font-medium text-white">{topic.title}</p>
                  <p className="mt-1 text-slate-300">{topic.ownerName || unassignedLabel}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
