import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

const DEMO_USERS = [
  {
    email: 'alice@acme.com',
    name: 'Alice Example',
  },
  {
    email: 'bob@acme.com',
    name: 'Bob Example',
  },
];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async ensureUserByEmail(email: string) {
    const defaultData = DEMO_USERS.find((user) => user.email === email) ?? {
      email,
      name: email.split('@')[0] ?? 'User',
    };

    await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        orgId: 'acme',
        name: defaultData.name,
        email: defaultData.email,
      },
    });

    return this.findByEmail(email);
  }

  async ensureDemoUser(email?: string | null) {
    await Promise.all(DEMO_USERS.map((user) => this.ensureUserByEmail(user.email)));
    const targetEmail = email ?? DEMO_USERS[0].email;
    return this.ensureUserByEmail(targetEmail);
  }
}
