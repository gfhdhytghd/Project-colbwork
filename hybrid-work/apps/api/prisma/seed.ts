import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@acme.com' },
    update: {},
    create: {
      orgId: 'acme',
      name: 'Alice Example',
      email: 'alice@acme.com',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@acme.com' },
    update: {},
    create: {
      orgId: 'acme',
      name: 'Bob Example',
      email: 'bob@acme.com',
    },
  });

  await prisma.desk.createMany({
    data: Array.from({ length: 10 }).map((_, index) => ({
      floorId: 'F1',
      label: `D-${index + 1}`,
      x: (index % 5) * 120 + 40,
      y: Math.floor(index / 5) * 120 + 40,
    })),
    skipDuplicates: true,
  });

  await prisma.presence.upsert({
    where: { userId: alice.id },
    create: { userId: alice.id, status: 'ONLINE', location: 'REMOTE' },
    update: { status: 'ONLINE', location: 'REMOTE' },
  });

  await prisma.presence.upsert({
    where: { userId: bob.id },
    create: { userId: bob.id, status: 'AWAY', location: 'OFFICE' },
    update: { status: 'AWAY', location: 'OFFICE' },
  });

  const existingThread = await prisma.thread.findFirst({
    where: {
      type: 'DM',
      participants: {
        some: { userId: alice.id },
        every: { userId: { in: [alice.id, bob.id] } },
      },
    },
    include: { participants: true },
  });

  const dmThread =
    existingThread && existingThread.participants.length === 2
      ? existingThread
      : await prisma.thread.create({
          data: {
            type: 'DM',
            createdBy: alice.id,
            participants: {
              create: [{ userId: alice.id }, { userId: bob.id }],
            },
          },
        });

  const existingSeedMessage = await prisma.message.findFirst({
    where: { threadId: dmThread.id },
  });

  if (!existingSeedMessage) {
    await prisma.message.createMany({
      data: [
        {
          threadId: dmThread.id,
          senderId: alice.id,
          body: 'Hey Bob! Are you joining the hybrid office tomorrow?',
        },
        {
          threadId: dmThread.id,
          senderId: bob.id,
          body: 'Yes! I booked desk D-3. Let’s sync on the calendar.',
        },
      ],
    });
  }

  await prisma.calendarEvent.upsert({
    where: { externalId: 'seed-alice-daily-standup' },
    update: {
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    create: {
      ownerId: alice.id,
      title: 'Daily stand-up',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 60 * 1000),
      visibility: 'PUBLIC',
      externalId: 'seed-alice-daily-standup',
    },
  });

  await prisma.calendarEvent.upsert({
    where: { externalId: 'seed-bob-focus-block' },
    update: {
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 120 * 60 * 1000),
    },
    create: {
      ownerId: bob.id,
      title: 'Focus block',
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 120 * 60 * 1000),
      visibility: 'FREEBUSY',
      externalId: 'seed-bob-focus-block',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
