import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../../common/security/password.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string) {
    const identifier = username.toLowerCase();
    const user =
      (await this.usersService.findByUsername(identifier)) ??
      (identifier.includes('@') ? await this.usersService.findByEmail(identifier) : null);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.configService.get<string>('jwtSecret'),
    });
    const { passwordHash, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }
}
