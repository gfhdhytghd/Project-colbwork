import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Use Node's process hook to ensure graceful shutdown without relying on Prisma's $on typings
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
