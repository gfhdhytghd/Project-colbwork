import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Prisma, ThreadType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ArrayNotEmpty, IsNotEmpty } from 'class-validator';
import { ImService } from './im.service';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

class CreateThreadDto {
  @IsEnum(ThreadType)
  type!: ThreadType;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  participantIds!: string[];
}

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  attachments?: Record<string, unknown>;
}

@Controller('threads')
export class ImController {
  constructor(
    private readonly imService: ImService,
    private readonly usersService: UsersService,
  ) {}

  private async getCurrentUserId(req: Request) {
    const headerEmail = (req.headers['x-demo-user'] as string | undefined)?.toLowerCase();
    const user = await this.usersService.ensureDemoUser(headerEmail);
    if (!user) {
      throw new Error('Unable to resolve demo user');
    }
    return user.id;
  }

  @Get()
  async list(@Req() req: Request) {
    const userId = await this.getCurrentUserId(req);
    return this.imService.listThreads(userId);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateThreadDto) {
    const userId = await this.getCurrentUserId(req);
    return this.imService.createThread(userId, dto);
  }

  @Get(':id/messages')
  async messages(
    @Param('id') id: string,
    @Query('take') take?: string,
  ) {
    return this.imService.listMessages(id, take ? Number(take) : 50);
  }

  @Post(':id/messages')
  async send(@Req() req: Request, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const userId = await this.getCurrentUserId(req);
    return this.imService.createMessage(userId, {
      threadId: id,
      body: dto.body,
      attachments: (dto.attachments as Prisma.InputJsonValue) ?? undefined,
    });
  }
}
