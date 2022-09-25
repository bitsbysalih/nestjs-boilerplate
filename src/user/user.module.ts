import { Module } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, PrismaService, StorageService],
})
export class UserModule {}
