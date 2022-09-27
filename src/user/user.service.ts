import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UploadedFile,
} from '@nestjs/common';
import { Users } from '@prisma/client';
import * as bcrypt from 'bcrypt';

//Services imports
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma.service';
import { AuthService } from 'src/auth/auth.service';

//DTO imports
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly authService: AuthService,
  ) {}

  async getAllUsers(getUsersDto: GetUsersDto) {
    try {
      const users = await this.prisma.users.findMany({
        skip: getUsersDto.skip || 0,
        take: getUsersDto.take || 10,
      });
      return users.map((user: any) => this.exclude(user, 'password'));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  async getUser(user: Users) {
    try {
      const getUsers = await this.prisma.users.findUnique({
        where: { id: user.id },
      });
      return this.exclude(getUsers, 'password');
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  async getUsersDetails(id: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Users not found');
      }
      return this.exclude(user, 'password');
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  async updateUsers(
    user: Users,
    updateUserDto: UpdateUserDto,
    @UploadedFile() profilePhoto: Express.Multer.File,
  ) {
    try {
      if (profilePhoto) {
        await this.storageService.uploadFile(profilePhoto);
      }
      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          ...updateUserDto,
          profilePhoto:
            profilePhoto &&
            `https://sailspad.fra1.digitaloceanspaces.com/${profilePhoto.originalname}`,
        },
      });
      return await this.authService.returnAccountDetails(updatedUser);
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  async changePassword(user: Users, updateUserDto: UpdateUserDto) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
      await this.prisma.users.update({
        where: { email: user.email },
        data: { password: hashedPassword },
      });
      return { passwordChanged: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  exclude<Users, Key extends keyof Users>(
    user: Users,
    ...keys: Key[]
  ): Omit<Users, Key> {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }
}
