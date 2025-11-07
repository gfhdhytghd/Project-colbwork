import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUsersController, AdminAccountController } from './admin-users.controller';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController, AdminAccountController],
  exports: [UsersService],
})
export class UsersModule {}
