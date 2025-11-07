import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { verifyPassword } from '../../common/security/password.utils';

class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  tz?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(4)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      username: dto.username,
      password: dto.password,
      role: Role.MEMBER,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.assertManageableUser(id);
    const { password, ...rest } = dto;
    const hasFields = Object.keys(rest).length > 0;
    if (hasFields) {
      await this.usersService.updateUser(id, rest);
    }
    if (password) {
      await this.usersService.updatePassword(id, password);
    }
    return this.usersService.findOne(user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const user = await this.assertManageableUser(id);
    await this.usersService.deleteUser(user.id);
    return { success: true };
  }

  private async assertManageableUser(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user || user.role !== Role.MEMBER) {
      throw new BadRequestException('Only member accounts can be managed.');
    }
    return user;
  }
}

@Roles(Role.ADMIN)
@Controller('admin/account')
export class AdminAccountController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('password')
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const principal = req['user'] as { id: string } | undefined;
    if (!principal?.id) {
      throw new BadRequestException('Missing authenticated admin');
    }
    const admin = await this.usersService.findById(principal.id);
    if (!admin || admin.role !== Role.ADMIN) {
      throw new BadRequestException('Admin account not found');
    }
    const isValid = verifyPassword(dto.currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.usersService.updatePassword(admin.id, dto.newPassword);
    return { success: true };
  }
}
