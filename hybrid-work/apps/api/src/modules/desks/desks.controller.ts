import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { IsDateString, IsOptional } from 'class-validator';
import { DesksService } from './desks.service';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

class ReserveDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

@Controller('desks')
export class DesksController {
  constructor(
    private readonly desksService: DesksService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  list(@Query('floor') floor?: string) {
    return this.desksService.listDesks(floor);
  }

  private async currentUserId(req: Request) {
    const email = (req.headers['x-demo-user'] as string | undefined)?.toLowerCase();
    const user = await this.usersService.ensureDemoUser(email);
    return user!.id;
  }

  @Post(':id/reservations')
  async reserve(@Req() req: Request, @Param('id') deskId: string, @Body() body: ReserveDto) {
    const userId = await this.currentUserId(req);
    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    const endsAt = body.endsAt ? new Date(body.endsAt) : new Date(Date.now() + 4 * 60 * 60 * 1000);
    return this.desksService.reserveDesk(userId, deskId, startsAt, endsAt);
  }

  @Delete('/reservations/:reservationId')
  async cancel(@Req() req: Request, @Param('reservationId') reservationId: string) {
    const userId = await this.currentUserId(req);
    return this.desksService.cancelReservation(reservationId, userId);
  }
}
