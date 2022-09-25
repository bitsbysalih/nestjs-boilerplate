import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { RolesGuard } from '../role/role.guard';
import { JwtAuthGuard } from '../auth/jwt-guard.guard';

import { GetUsersDto } from './dto/get-users.dto';
import { UserService } from './user.service';

//Decorator imports
import { Roles } from '../role/roles.decorator';
import { Role, Users } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from 'src/auth/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

//Guards imports

@UseGuards(JwtAuthGuard)
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUserss(@Body() getUsersDto: GetUsersDto) {
    return this.userService.getAllUsers(getUsersDto);
  }

  @Get()
  async getUsers(@GetUser() user: Users) {
    return await this.userService.getUser(user);
  }

  @Put()
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updateUsers(
    @Body() updateUsersDto: UpdateUserDto,
    @UploadedFile() profilePhoto: Express.Multer.File,
    @GetUser() user: Users,
  ) {
    return await this.userService.updateUsers(
      user,
      updateUsersDto,
      profilePhoto,
    );
  }

  @Get(':id')
  async getUsersDetails(@Param('id') id: string) {
    return await this.userService.getUsersDetails(id);
  }
}
