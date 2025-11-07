import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('me')
  me(@Req() req: Request) {
    return req['user'] || null;
  }
}
