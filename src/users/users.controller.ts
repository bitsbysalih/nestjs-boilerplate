import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardsService } from 'src/cards/cards.service';
import { AccountDeletionRequest } from './models/request/account-deletion.request';
import { AdjustCardCountRequest } from './models/request/adjust-card-count.request';
import { User } from './schemas/user.schema';
import { GetUser } from './users.decorator';
import { UsersService } from './users.service';

@ApiTags('user')
@Controller('users')
export class UsersController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: 'Retrieves all users',
  })
  @UseGuards(AuthGuard())
  async loadAllUsers(@GetUser() user: User) {
    return this.usersService.loadAllUsers(user);
  }

  @Get('/cards')
  @ApiOperation({
    summary: "Retrieves user's card",
  })
  @UseGuards(AuthGuard())
  async getUserCards(@GetUser() user: User) {
    return this.cardsService.getUserCards(user);
  }

  @Post('/adjust-card-count')
  @ApiOperation({
    summary: 'Adjusts card slots in admin panel',
  })
  @UseGuards(AuthGuard())
  async adjustUserCardCount(
    @GetUser() user: User,
    @Body() adjustCardCountRequest: AdjustCardCountRequest,
  ) {
    return this.usersService.adjustUserCardCount(user, adjustCardCountRequest);
  }

  @Post('/delete-account')
  @ApiOperation({
    summary: "Retrieves user's card",
  })
  @UseGuards(AuthGuard())
  async deleteAccount(
    @GetUser() user: User,
    @Body() accountDeletionRequest: AccountDeletionRequest,
  ) {
    return this.usersService.deleteAccount(user, accountDeletionRequest);
  }
}
