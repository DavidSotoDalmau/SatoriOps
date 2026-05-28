import { PrismaClient, Priority, Role, Status } from "@prisma/client";

const db = new PrismaClient();

const areas = [
  "Direccion",
  "CFP",
  "Sponsors",
  "Venue",
  "Infra",
  "CTF",
  "Streaming",
  "Diseno",
  "Web",
  "Finanzas",
  "Legal",
  "Voluntariado",
  "Comunicacion",
];

async function main() {
  const organization =
    (await db.organization.findFirst({
      where: { slug: "denno-satori" },
    })) ??
    (await db.organization.create({
      data: {
        name: "Denno Satori",
        slug: "denno-satori",
        description: "Cybersecurity conference operations.",
      },
    }));

  const ownerMembership = await db.membership.findFirst({
    where: {
      organizationId: organization.id,
      role: Role.OWNER,
      active: true,
    },
  });

  if (!ownerMembership) {
    throw new Error("Bootstrap an owner before running the demo seed.");
  }

  const event =
    (await db.event.findFirst({
      where: {
        organizationId: organization.id,
        slug: "satoricon",
      },
    })) ??
    (await db.event.create({
      data: {
        organizationId: organization.id,
        createdById: ownerMembership.id,
        name: "SatoriCON",
        slug: "satoricon",
        description: "Demo cybersecurity conference planning workspace.",
        status: Status.ACTIVE,
      },
    }));

  const createdTopics = [];

  for (const area of areas) {
    const existingTopic = await db.topic.findFirst({
      where: {
        eventId: event.id,
        title: `${area} readiness`,
      },
    });

    const topic =
      existingTopic ??
      (await db.topic.create({
        data: {
          eventId: event.id,
          ownerId: ownerMembership.id,
          createdById: ownerMembership.id,
          title: `${area} readiness`,
          area,
          status: area === "Venue" ? Status.BLOCKED : Status.ACTIVE,
          priority:
            area === "Venue" || area === "Sponsors" || area === "Infra"
              ? Priority.HIGH
              : Priority.MEDIUM,
          description: `Operational checklist and open work for ${area}.`,
        },
      }));

    createdTopics.push(topic);
  }

  for (const topic of createdTopics.slice(0, 5)) {
    const existingTask = await db.task.findFirst({
      where: {
        topicId: topic.id,
        title: `Review ${topic.area} blockers`,
      },
    });

    if (!existingTask) {
      await db.task.create({
        data: {
          topicId: topic.id,
          ownerId: ownerMembership.id,
          createdById: ownerMembership.id,
          title: `Review ${topic.area} blockers`,
          status: topic.status === Status.BLOCKED ? Status.BLOCKED : Status.ACTIVE,
          priority: topic.priority,
          description: `Validate progress, dependencies and owner alignment for ${topic.area}.`,
        },
      });
    }
  }

  const venueTopic = createdTopics.find((topic) => topic.area === "Venue");
  const sponsorsTopic = createdTopics.find((topic) => topic.area === "Sponsors");
  const streamingTopic = createdTopics.find((topic) => topic.area === "Streaming");

  if (venueTopic && sponsorsTopic) {
    const existingDependency = await db.dependency.findFirst({
      where: {
        blockedTopicId: venueTopic.id,
        blockingTopicId: sponsorsTopic.id,
      },
    });

    if (!existingDependency) {
      await db.dependency.create({
        data: {
          blockedTopicId: venueTopic.id,
          blockingTopicId: sponsorsTopic.id,
          note: "Final venue approval depends on sponsorship budget confirmation.",
        },
      });
    }
  }

  if (streamingTopic) {
    const existingDecision = await db.decision.findFirst({
      where: {
        eventId: event.id,
        title: "Streaming platform selection",
      },
    });

    if (!existingDecision) {
      await db.decision.create({
        data: {
          eventId: event.id,
          topicId: streamingTopic.id,
          createdById: ownerMembership.id,
          title: "Streaming platform selection",
          summary: "Evaluate trade-offs between self-hosted ingest and managed CDN edge delivery.",
          status: Status.PLANNED,
        },
      });
    }
  }

  console.log("Demo seed completed.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
