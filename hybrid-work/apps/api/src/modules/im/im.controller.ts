import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Prisma, ThreadType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ArrayNotEmpty, IsNotEmpty } from 'class-validator';
import { ImService } from './im.service';
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
  constructor(private readonly imService: ImService) {}

  private getCurrentUserId(req: Request) {
    const user = req['user'] as { id: string } | undefined;
    if (!user?.id) {
      throw new Error('Missing authenticated user');
    }
    return user.id;
  }

  @Get()
  async list(@Req() req: Request) {
    const userId = this.getCurrentUserId(req);
    return this.imService.listThreads(userId);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateThreadDto) {
    const userId = this.getCurrentUserId(req);
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
    const userId = this.getCurrentUserId(req);
    return this.imService.createMessage(userId, {
      threadId: id,
      body: dto.body,
      attachments: (dto.attachments as Prisma.InputJsonValue) ?? undefined,
    });
  }
}
