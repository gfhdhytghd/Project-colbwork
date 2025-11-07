import { Injectable, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { hashPassword } from '../../common/security/password.utils';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminAccount();
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async createUser(input: {
    orgId?: string;
    name: string;
    email: string;
    username: string;
    password: string;
    role?: Role;
  }) {
    const passwordHash = hashPassword(input.password);
    return this.prisma.user.create({
      data: {
        orgId: input.orgId ?? 'acme',
        name: input.name,
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        passwordHash,
        role: input.role ?? Role.MEMBER,
      },
    });
  }

  async updateUser(
    id: string,
    input: Partial<{
      name: string;
      email: string;
      username: string;
      role: Role;
      tz: string;
    }>,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...input,
        email: input.email ? input.email.toLowerCase() : undefined,
        username: input.username ? input.username.toLowerCase() : undefined,
      },
    });
  }

  async updatePassword(id: string, password: string) {
    const passwordHash = hashPassword(password);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  private async ensureAdminAccount() {
    const existing = await this.prisma.user.findFirst({
      where: { username: 'admin' },
    });
    if (!existing) {
      await this.createUser({
        name: 'Workspace Admin',
        email: 'admin@acme.com',
        username: 'admin',
        password: 'admin',
        role: Role.ADMIN,
        orgId: 'acme',
      });
    }
  }
}
