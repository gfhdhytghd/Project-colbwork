import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PresenceService } from './presence.service';

class PresenceDto {
  status?: string;
  location?: string;
  deskId?: string | null;
}

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post()
  update(@Body() body: PresenceDto) {
    const userId = 'placeholder-user';
    return this.presenceService.upsertPresence(userId, {
      status: body.status ?? 'ONLINE',
      location: body.location ?? 'REMOTE',
      deskId: body.deskId ?? null,
    });
  }

  @Get()
  list(@Query('floor') floor?: string) {
    return this.presenceService.listPresenceByFloor(floor);
  }

  @Get('users')
  listByUsers(@Query('userIds') userIds?: string) {
    const ids = (userIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return this.presenceService.listPresenceByUsers(ids);
  }
}
