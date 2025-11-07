import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { IsEmail } from 'class-validator';

class LoginDto {
  @IsEmail()
  email!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email);
  }

  @Get('me')
  me(@Req() req: Request) {
    return req['user'] || null;
  }
}
