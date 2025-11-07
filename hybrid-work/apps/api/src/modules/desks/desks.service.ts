import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DesksService {
  constructor(private readonly prisma: PrismaService) {}

  listDesks(floorId?: string) {
    return this.prisma.desk.findMany({
      where: floorId ? { floorId } : undefined,
      include: {
        reservations: {
          where: {
            status: 'ACTIVE',
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
          include: { user: true },
        },
      },
    });
  }

  async reserveDesk(userId: string, deskId: string, startsAt: Date, endsAt: Date) {
    // prevent overlap
    const overlap = await this.prisma.deskReservation.findFirst({
      where: {
        deskId,
        status: 'ACTIVE',
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });
    if (overlap) {
      throw new Error('Desk is already reserved in that time range');
    }

    const created = await this.prisma.deskReservation.create({
      data: {
        deskId,
        userId,
        startsAt,
        endsAt,
        status: 'ACTIVE',
      },
      include: { desk: true, user: true },
    });

    // update presence marker for convenience
    await this.prisma.presence.upsert({
      where: { userId },
      create: { userId, location: 'OFFICE', status: 'ONLINE', deskId },
      update: { location: 'OFFICE', deskId, lastSeen: new Date() },
    });

    return created;
  }

  async cancelReservation(reservationId: string, userId: string) {
    const existing = await this.prisma.deskReservation.findUnique({ where: { id: reservationId } });
    if (!existing) throw new Error('Reservation not found');
    if (existing.userId !== userId) throw new Error('You can only cancel your own reservation');
    const result = await this.prisma.deskReservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    // If user cancels current reservation, set presence back to REMOTE if pointing to this desk
    const presence = await this.prisma.presence.findUnique({ where: { userId } });
    if (presence?.deskId === existing.deskId) {
      await this.prisma.presence.update({
        where: { userId },
        data: { location: 'REMOTE', deskId: null, lastSeen: new Date() },
      });
    }
    return result;
  }
}
