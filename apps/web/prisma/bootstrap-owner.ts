import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

function readArg(name: string) {
  const entry = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return entry ? entry.split("=")[1] : undefined;
}

async function main() {
  const email = (readArg("email") ?? process.env.BOOTSTRAP_OWNER_EMAIL ?? "").toLowerCase();
  const name = readArg("name") ?? process.env.BOOTSTRAP_OWNER_NAME ?? "Initial Owner";
  const password = readArg("password");

  if (!email || !password || password.length < 12) {
    throw new Error("Provide --email and --password with at least 12 characters.");
  }

  const existingOwner = await db.membership.findFirst({
    where: { role: Role.OWNER, active: true },
  });

  if (existingOwner) {
    throw new Error("An active owner already exists. Bootstrap can only be used once.");
  }

  const organization =
    (await db.organization.findFirst({
      where: { slug: "denno-satori" },
    })) ??
    (await db.organization.create({
      data: {
        name: "Denno Satori",
        slug: "denno-satori",
        description: "Security-first conference operations.",
      },
    }));

  const passwordHash = await hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
    },
    create: {
      name,
      email,
      passwordHash,
    },
  });

  await db.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: Role.OWNER,
    },
  });

  console.log(`Bootstrap owner created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Bootstrap failed.");
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
