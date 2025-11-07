import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { UsersModule } from '../users/users.module';
import { ImController } from './im.controller';
import { ImService } from './im.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ImController],
  providers: [ImService],
  exports: [ImService],
})
export class ImModule {}
