import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { UsersModule } from '../users/users.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
