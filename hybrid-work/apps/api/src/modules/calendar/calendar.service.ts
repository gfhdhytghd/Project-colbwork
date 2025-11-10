import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BlockKind, Prisma, RequestStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';

export interface CreateEventInput {
  ownerId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  visibility?: Visibility;
}

interface CreateBlockInput {
  ownerId: string;
  startsAt: Date;
  endsAt: Date;
  kind: BlockKind;
  visibility?: Visibility;
}

interface CreateRequestInput {
  requesterId: string;
  targetUserId: string;
  eventDraft: Prisma.JsonObject;
  notes?: string;
}

interface UpdateEventInput {
  title?: string;
  startsAt?: Date;
  endsAt?: Date;
  location?: string | null;
  visibility?: Visibility;
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  eventsForUser(ownerId: string, from?: Date, to?: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        ownerId,
        startsAt: from ? { gte: from } : undefined,
        endsAt: to ? { lte: to } : undefined,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  availabilityBlocks(ownerId: string, from?: Date, to?: Date) {
    return this.prisma.availabilityBlock.findMany({
      where: {
        ownerId,
        startsAt: from ? { gte: from } : undefined,
        endsAt: to ? { lte: to } : undefined,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  createEvent(input: CreateEventInput) {
    return this.prisma.calendarEvent.create({
      data: {
        ownerId: input.ownerId,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location ?? null,
        visibility: input.visibility ?? Visibility.FREEBUSY,
        createdBy: input.ownerId,
      },
    });
  }

  createAvailabilityBlock(input: CreateBlockInput) {
    return this.prisma.availabilityBlock.create({
      data: {
        ownerId: input.ownerId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        kind: input.kind,
        visibility: input.visibility ?? Visibility.FREEBUSY,
      },
    });
  }

  activeBlocks(userIds: string[], now: Date) {
    if (!userIds.length) return Promise.resolve([]);
    return this.prisma.availabilityBlock.findMany({
      where: {
        ownerId: { in: userIds },
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: {
        id: true,
        ownerId: true,
        kind: true,
        visibility: true,
        startsAt: true,
        endsAt: true,
      },
    });
  }

  listScheduleRequests(userId: string, scope: 'incoming' | 'outgoing') {
    return this.prisma.scheduleRequest.findMany({
      where: scope === 'incoming' ? { targetUserId: userId } : { requesterId: userId },
      include: {
        requester: true,
        targetUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createScheduleRequest(input: CreateRequestInput) {
    const target = await this.prisma.user.findUnique({ where: { id: input.targetUserId } });
    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    if (target.id === input.requesterId) {
      throw new ForbiddenException('Cannot create a request for yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Create the schedule request
      const created = await tx.scheduleRequest.create({
        data: {
          requesterId: input.requesterId,
          targetUserId: input.targetUserId,
          eventDraft: input.eventDraft,
          notes: input.notes ?? null,
        },
        include: {
          requester: true,
          targetUser: true,
        },
      });

      // 2) Ensure a DM thread exists between requester and target
      const dm = await tx.thread.findFirst({
        where: {
          type: 'DM',
          participants: {
            some: { userId: input.requesterId },
          },
          AND: [
            {
              participants: {
                some: { userId: input.targetUserId },
              },
            },
          ],
        },
        include: { participants: true },
      });

      let threadId = dm?.id;
      if (!threadId) {
        const newDm = await tx.thread.create({
          data: {
            type: 'DM',
            createdBy: input.requesterId,
            participants: {
              create: [{ userId: input.requesterId }, { userId: input.targetUserId }],
            },
          },
        });
        threadId = newDm.id;
      }

      // 3) Post a message into the DM notifying about the request
      const draft = (input.eventDraft ?? {}) as Record<string, any>;
      const title = typeof draft.title === 'string' && draft.title.trim().length ? draft.title : 'Meeting request';
      const startsAt = draft.startsAt ? new Date(draft.startsAt) : null;
      const endsAt = draft.endsAt ? new Date(draft.endsAt) : null;
      const range = startsAt && endsAt ? `${startsAt.toISOString()} → ${endsAt.toISOString()}` : '';
      const body = `Calendar request: ${title}${range ? ` (${range})` : ''}`;

      await tx.message.create({
        data: {
          threadId: threadId!,
          senderId: input.requesterId,
          body,
          attachments: {
            kind: 'calendar-request',
            requestId: created.id,
            targetUserId: input.targetUserId,
            title,
            startsAt: draft.startsAt ?? null,
            endsAt: draft.endsAt ?? null,
            location: draft.location ?? null,
            visibility: draft.visibility ?? Visibility.FREEBUSY,
          } as any,
        },
      });

      return created;
    });
  }

  async nextAvailability(userIds: string[], now: Date, horizon: Date) {
    if (!userIds.length) return [];
    const clampedHorizon = horizon.getTime() <= now.getTime() ? new Date(now.getTime() + 60 * 60 * 1000) : horizon;
    const [events, blocks] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          ownerId: { in: userIds },
          endsAt: { gte: now },
          startsAt: { lte: clampedHorizon },
        },
        select: {
          ownerId: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.availabilityBlock.findMany({
        where: {
          ownerId: { in: userIds },
          endsAt: { gte: now },
          startsAt: { lte: clampedHorizon },
        },
        select: {
          ownerId: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    const intervalsByUser = new Map<string, { startsAt: Date; endsAt: Date }[]>();
    for (const userId of userIds) {
      intervalsByUser.set(userId, []);
    }

    for (const event of events) {
      intervalsByUser.get(event.ownerId)?.push({ startsAt: event.startsAt, endsAt: event.endsAt });
    }
    for (const block of blocks) {
      intervalsByUser.get(block.ownerId)?.push({ startsAt: block.startsAt, endsAt: block.endsAt });
    }

    const summaries: { userId: string; availableAt: Date }[] = [];
    for (const userId of userIds) {
      const intervals = intervalsByUser.get(userId) ?? [];
      intervals.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      let cursor = new Date(now);
      for (const interval of intervals) {
        if (interval.endsAt.getTime() <= cursor.getTime()) {
          continue;
        }
        if (interval.startsAt.getTime() > cursor.getTime()) {
          break;
        }
        if (interval.startsAt.getTime() <= cursor.getTime() && interval.endsAt.getTime() > cursor.getTime()) {
          cursor = new Date(interval.endsAt);
        }
      }
      summaries.push({ userId, availableAt: cursor });
    }

    return summaries.map((summary) => ({
      userId: summary.userId,
      availableAt: summary.availableAt.toISOString(),
    }));
  }

  async updateScheduleRequestStatus(id: string, actorId: string, status: RequestStatus) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.scheduleRequest.findUnique({
        where: { id },
        include: {
          requester: true,
          targetUser: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Schedule request not found');
      }

      if (existing.targetUserId !== actorId) {
        throw new ForbiddenException('Only the target user can update the request');
      }

      if (existing.status !== RequestStatus.PENDING) {
        return existing;
      }

      const updated = await tx.scheduleRequest.update({
        where: { id },
        data: {
          status,
          decidedAt: new Date(),
        },
        include: {
          requester: true,
          targetUser: true,
        },
      });

      if (status === RequestStatus.APPROVED) {
        const draft = (existing.eventDraft ?? {}) as Record<string, any>;
        const startsAt = draft.startsAt ? new Date(draft.startsAt) : new Date();
        const endsAt = draft.endsAt
          ? new Date(draft.endsAt)
          : new Date(startsAt.getTime() + 30 * 60 * 1000);

        const requestedVisibility =
          typeof draft.visibility === 'string' &&
          (Object.values(Visibility) as string[]).includes(draft.visibility)
            ? (draft.visibility as Visibility)
            : Visibility.FREEBUSY;

        await tx.calendarEvent.create({
          data: {
            ownerId: existing.targetUserId,
            title:
              typeof draft.title === 'string' && draft.title.trim().length
                ? draft.title
                : 'Scheduled meeting',
            startsAt,
            endsAt,
            location: typeof draft.location === 'string' ? draft.location : null,
            visibility: requestedVisibility,
            createdBy: existing.requesterId,
            source: 'request',
          },
        });

        // Also create a mirror event for the requester (so both parties have the event)
        await tx.calendarEvent.create({
          data: {
            ownerId: existing.requesterId,
            title:
              typeof draft.title === 'string' && draft.title.trim().length
                ? draft.title
                : 'Scheduled meeting',
            startsAt,
            endsAt,
            location: typeof draft.location === 'string' ? draft.location : null,
            visibility: requestedVisibility,
            createdBy: existing.targetUserId,
            source: 'request',
          },
        });
      }

      return updated;
    });
  }

  async updateEvent(eventId: string, actorId: string, data: UpdateEventInput) {
    const existing = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    if (existing.ownerId !== actorId) {
      throw new ForbiddenException('Only the owner can update this event');
    }

    if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt) {
      throw new Error('StartsAt must be before endsAt');
    }

    return this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: data.title,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        location: data.location,
        visibility: data.visibility,
      },
    });
  }

  async deleteEvent(eventId: string, actorId: string) {
    const existing = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { id: true, ownerId: true },
    });
    if (!existing) throw new NotFoundException('Event not found');
    if (existing.ownerId !== actorId) {
      throw new ForbiddenException('Only the owner can delete this event');
    }
    await this.prisma.calendarEvent.delete({ where: { id: eventId } });
    return { id: eventId };
  }
}
