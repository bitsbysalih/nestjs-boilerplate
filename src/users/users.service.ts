import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { AccountDeletionRequest } from './models/request/account-deletion.request';
import { AdjustCardCountRequest } from './models/request/adjust-card-count.request';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private stripe: Stripe;
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async loadAllUsers(user: User) {
    if (user.role[1] !== 'admin') {
      throw new UnauthorizedException(
        'This user is not permitted to perform this action',
      );
    }
    const users = await this.userModel.find({});
    return users;
  }
  async adjustUserCardCount(
    user: User,
    adjustCardCountRequest: AdjustCardCountRequest,
  ) {
    if (user.role[1] !== 'admin') {
      throw new UnauthorizedException(
        'This user is not permitted to perform this action',
      );
    }
    const foundUser = await this.userModel.findById(
      adjustCardCountRequest.userId,
    );
    await foundUser.updateOne({
      cardSlots: foundUser.cardSlots + adjustCardCountRequest.amount,
      availableCardSlots:
        foundUser.availableCardSlots + adjustCardCountRequest.amount,
      manuallyAddedSlots:
        foundUser.manuallyAddedSlots + adjustCardCountRequest.amount,
    });
    await foundUser.save();
  }

  async deleteAccount(
    user: User,
    accountDeleteionRequest: AccountDeletionRequest,
  ) {
    if (user.role[1] !== 'admin') {
      throw new UnauthorizedException(
        'This user is not permitted to perform this action',
      );
    }
    const userToDelete = await this.userModel.findById(
      accountDeleteionRequest.userId,
    );
    if (userToDelete) {
      await userToDelete.delete();
      return { message: 'Account deleted Successfully' };
    }
  }
}
