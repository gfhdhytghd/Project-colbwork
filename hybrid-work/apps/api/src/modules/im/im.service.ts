import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ThreadType } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';

interface CreateThreadInput {
  type: ThreadType;
  participantIds: string[];
  topic?: string | null;
}

interface CreateMessageInput {
  threadId: string;
  body: string;
  attachments?: Prisma.InputJsonValue | null;
}

@Injectable()
export class ImService {
  constructor(private readonly prisma: PrismaService) {}

  listThreads(userId: string) {
    return this.prisma.thread.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMessages(threadId: string, take = 50) {
    return this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take,
      include: { sender: true },
    });
  }

  async createThread(userId: string, input: CreateThreadInput) {
    const uniqueParticipantIds = Array.from(new Set([...input.participantIds, userId]));

    if (input.type === ThreadType.DM && uniqueParticipantIds.length !== 2) {
      throw new BadRequestException('DM threads must include exactly two participants.');
    }

    // Try to reuse existing DM conversations to avoid duplicates
    if (input.type === ThreadType.DM) {
      const candidates = await this.prisma.thread.findMany({
        where: {
          type: ThreadType.DM,
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: true },
          },
        },
      });

      const existing = candidates.find(
        (thread) =>
          thread.participants.length === uniqueParticipantIds.length &&
          thread.participants.every((participant) => uniqueParticipantIds.includes(participant.userId)),
      );

      if (existing) {
        return this.prisma.thread.findUnique({
          where: { id: existing.id },
          include: {
            participants: { include: { user: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: true },
            },
          },
        });
      }
    }

    return this.prisma.thread.create({
      data: {
        type: input.type,
        createdBy: userId,
        participants: {
          create: uniqueParticipantIds.map((participantId) => ({ userId: participantId })),
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
    });
  }

  async createMessage(userId: string, input: CreateMessageInput) {
    const membership = await this.prisma.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId: input.threadId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not part of this thread.');
    }

    return this.prisma.message.create({
      data: {
        threadId: input.threadId,
        senderId: userId,
        body: input.body,
        attachments: input.attachments ?? undefined,
      },
      include: { sender: true },
    });
  }
}
