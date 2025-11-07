import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  upsertPresence(userId: string, payload: any) {
    return this.prisma.presence.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: { ...payload, lastSeen: new Date() },
    });
  }

  listPresenceByFloor(floorId?: string) {
    return this.prisma.presence.findMany({
      where: floorId
        ? { desk: { floorId } }
        : undefined,
      include: { user: true, desk: true },
    });
  }

  listPresenceByUsers(userIds: string[]) {
    if (!userIds.length) return Promise.resolve([]);
    return this.prisma.presence.findMany({
      where: { userId: { in: userIds } },
      include: { user: true, desk: true },
    });
  }
}
