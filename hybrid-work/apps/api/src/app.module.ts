import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { PrismaModule } from './config/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DesksModule } from './modules/desks/desks.module';
import { ImModule } from './modules/im/im.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PresenceModule } from './modules/presence/presence.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PresenceModule,
    ImModule,
    CalendarModule,
    DesksModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
