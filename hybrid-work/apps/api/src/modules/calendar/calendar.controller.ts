import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { BlockKind, RequestStatus, Visibility } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CalendarService } from './calendar.service';
import { Request } from 'express';

class CreateEventDto {
  @IsString()
  title!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

class CreateBlockDto {
  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsEnum(BlockKind)
  kind!: BlockKind;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

class CreateRequestDto {
  @IsUUID()
  targetUserId!: string;

  @IsString()
  title!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateRequestDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}

class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  private resolveViewer(req: Request) {
    const user = req['user'] as { id: string } | undefined;
    if (!user?.id) {
      throw new Error('Missing authenticated user');
    }
    return user;
  }

  private resolveOwnerId(rawOwner: string | undefined, viewerId: string) {
    if (!rawOwner || rawOwner === 'me') {
      return viewerId;
    }
    return rawOwner;
  }

  private maskEventForViewer(event: any, viewerId: string) {
    if (event.ownerId === viewerId) {
      return event;
    }

    if (event.visibility === 'PUBLIC') {
      return event;
    }

    return {
      ...event,
      title: event.visibility === 'PRIVATE' ? 'Private event' : 'Busy',
      location: null,
      source: event.source,
    };
  }

  @Get('events')
  async events(
    @Req() req: Request,
    @Query('owner') owner?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const viewer = this.resolveViewer(req);
    const ownerId = this.resolveOwnerId(owner, viewer.id);
    const events = await this.calendarService.eventsForUser(
      ownerId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );

    return events.map((event) => this.maskEventForViewer(event, viewer.id));
  }

  @Get('blocks')
  async blocks(
    @Req() req: Request,
    @Query('owner') owner?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const viewer = this.resolveViewer(req);
    const ownerId = this.resolveOwnerId(owner, viewer.id);
    return this.calendarService.availabilityBlocks(
      ownerId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Post('events')
  async createEvent(@Req() req: Request, @Body() body: CreateEventDto) {
    const viewer = this.resolveViewer(req);
    const ownerId = body.ownerId ?? viewer.id;

    if (ownerId !== viewer.id) {
      throw new Error('Creating events for other users is not supported in demo mode');
    }

    const created = await this.calendarService.createEvent({
      ownerId,
      title: body.title,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      location: body.location,
      visibility: body.visibility,
    });

    return this.maskEventForViewer(created, viewer.id);
  }

  @Post('blocks')
  async createBlock(@Req() req: Request, @Body() body: CreateBlockDto) {
    const viewer = this.resolveViewer(req);
    const created = await this.calendarService.createAvailabilityBlock({
      ownerId: viewer.id,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      kind: body.kind,
      visibility: body.visibility,
    });

    return created;
  }

  @Get('requests')
  async listRequests(@Req() req: Request, @Query('scope') scope: 'incoming' | 'outgoing' = 'incoming') {
    const viewer = this.resolveViewer(req);
    return this.calendarService.listScheduleRequests(viewer.id, scope);
  }

  @Post('requests')
  async createRequest(@Req() req: Request, @Body() body: CreateRequestDto) {
    const viewer = this.resolveViewer(req);
    return this.calendarService.createScheduleRequest({
      requesterId: viewer.id,
      targetUserId: body.targetUserId,
      notes: body.notes,
      eventDraft: {
        title: body.title,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        location: body.location,
        visibility: body.visibility ?? Visibility.FREEBUSY,
      },
    });
  }

  @Patch('requests/:id')
  async updateRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateRequestDto,
  ) {
    const viewer = this.resolveViewer(req);
    return this.calendarService.updateScheduleRequestStatus(id, viewer.id, body.status);
  }

  @Get('active-blocks')
  async activeBlocks(@Req() req: Request, @Query('userIds') userIds?: string) {
    const viewer = this.resolveViewer(req);
    const ids = (userIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!ids.length) return [];
    const now = new Date();
    const blocks = await this.calendarService.activeBlocks(ids, now);
    // Respect visibility: if not owner, hide PRIVATE entries
    return blocks.filter((b) => b.ownerId === viewer.id || b.visibility !== 'PRIVATE');
  }

  @Patch('events/:id')
  async updateEvent(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateEventDto) {
    const viewer = this.resolveViewer(req);
    const updated = await this.calendarService.updateEvent(id, viewer.id, {
      title: body.title,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      location: body.location ?? undefined,
      visibility: body.visibility,
    });
    return this.maskEventForViewer(updated, viewer.id);
  }

  @Delete('events/:id')
  async deleteEvent(@Req() req: Request, @Param('id') id: string) {
    const viewer = this.resolveViewer(req);
    return this.calendarService.deleteEvent(id, viewer.id);
  }
}
