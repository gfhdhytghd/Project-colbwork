import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { UsersModule } from '../users/users.module';
import { DesksController } from './desks.controller';
import { DesksService } from './desks.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [DesksController],
  providers: [DesksService],
})
export class DesksModule {}
