import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Headers,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/users/schemas/user.schema';
import { GetUser } from 'src/users/users.decorator';
import { CreateSubscriptionRequest } from './models/request/create-subscription.request';
import RequestWithRawBody from './request-with-raw-body.interface';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('get-cards')
  @ApiOperation({
    summary: 'Lists all cards attached to user',
  })
  @UseGuards(AuthGuard())
  async listSavedCards(@GetUser() user: User) {
    return this.stripeService.listSavedCards(user);
  }

  @Post('create-monthly-subscription')
  @ApiOperation({
    summary: "Creates user's subscription based on number of card slots chosen",
  })
  @UseGuards(AuthGuard())
  async createMonthlySubscription(
    @GetUser() user: User,
    @Body() createSubscriptionRequest: CreateSubscriptionRequest,
  ) {
    return this.stripeService.createMonthlySubscription(
      createSubscriptionRequest,
      user,
    );
  }

  @Patch('upgrade-monthly-subscription')
  @ApiOperation({
    summary: "updates user's subscription based on number of card slots chosen",
  })
  @UseGuards(AuthGuard())
  async updateMonthlySubscription(
    @GetUser() user: User,
    @Body() createSubscriptionRequest: CreateSubscriptionRequest,
  ) {
    return this.stripeService.upgradeMonthlySubscription(
      createSubscriptionRequest,
      user,
    );
  }

  @Post('update-payment-method')
  @UseGuards(AuthGuard())
  async updatePaymentMethod(
    @GetUser() user: User,
    // @Body() createSubscriptionRequest: CreateSubscriptionRequest,
  ) {
    return this.stripeService.updatePaymentMethod(user);
  }

  @Post('cancel-monthly-subscription')
  @ApiOperation({
    summary: 'Cancels user subscription an puts account on hold',
  })
  @UseGuards(AuthGuard())
  async cancelMonthlySubscription(@GetUser() user: User) {
    return this.stripeService.cancelMonthlySubscription(user);
  }

  @Post('billing-portal')
  @ApiOperation({
    summary: 'Opens billing portal',
  })
  @UseGuards(AuthGuard())
  async billingPortal(@GetUser() user: User) {
    return this.stripeService.billingPortal(user);
  }

  @Post('webhook')
  @ApiOperation({
    summary:
      'Webhook for stripe to do user updates it needs to do. (Not for frontend devs). This is for stripe',
  })
  async handleIncomingEvents(
    @Headers('stripe-signature') signature: string,
    @Req() request: RequestWithRawBody,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const event = await this.stripeService.constructEventFromPayload(
      signature,
      request.rawBody,
    );
    return this.stripeService.processSubscriptionUpdate(event);
  }
}
