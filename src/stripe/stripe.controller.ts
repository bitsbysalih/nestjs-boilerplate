import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Users } from '@prisma/client';
import { GetUser } from 'src/auth/auth.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-guard.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import RequestWithRawBody from './request-with-raw-body.interface';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@Controller({ path: 'stripe', version: '1' })
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment-intent')
  @ApiOperation({
    summary:
      "Creates Users's subscription based on number of card slots chosen",
  })
  @UseGuards(JwtAuthGuard)
  async createMonthlySubscription(
    @GetUser() user: Users,
    @Body() createPaymentIntent: CreatePaymentIntentDto,
  ) {
    return this.stripeService.createMonthlySubscription(
      createPaymentIntent,
      user,
    );
  }

  @Post('create-billing')
  @ApiOperation({
    summary:
      "Creates Users's subscription based on number of card slots chosen",
  })
  @UseGuards(JwtAuthGuard)
  async createBillingPortal(@GetUser() user: Users) {
    return this.stripeService.createBillingPortal(user);
  }

  @Post('webhook')
  @ApiOperation({
    summary:
      'Webhook for stripe to do Users updates it needs to do. (Not for frontend devs). This is for stripe',
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
