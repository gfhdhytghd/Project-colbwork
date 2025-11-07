import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('me')
  me(@Req() req: Request) {
    return req['user'] || null;
  }
}
