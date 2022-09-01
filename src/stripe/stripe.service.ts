import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailSenderService } from 'src/mail-sender/mail-sender.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import Stripe from 'stripe';
import StripeError from './enum/stripe-error.enum';
import { CreateSubscriptionRequest } from './models/request/create-subscription.request';
// import { StripeEvent } from './schemas/stripe-event.schema';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // @InjectModel(StripeEvent.name)
    private mailSenderService: MailSenderService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SK, {
      apiVersion: '2020-08-27',
    });
  }

  async createCustomer(name: string, email: string) {
    try {
      return this.stripe.customers.create({
        name,
        email,
      });
    } catch (error) {
      throw new BadRequestException('error creating customer', error.message);
    }
  }

  async listSavedCards(user: User) {
    try {
      return this.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
    } catch (error) {
      throw new BadRequestException('Error listing cards', error.message);
    }
  }

  async createMonthlySubscription(
    createSubscriptionRequest: CreateSubscriptionRequest,
    user: User,
  ) {
    try {
      const monthlyPriceId = process.env.MONTHLY_SUBSCRIPTION_PRICE_ID;
      const yearlyPriceId = process.env.YEARLY_SUBSCRIPTION_PRICE_ID;

      const subscriptions = await this.listSubscriptions(
        createSubscriptionRequest.yearlySubscription
          ? yearlyPriceId
          : monthlyPriceId,
        user.stripeCustomerId,
      );

      if (subscriptions.data.length) {
        throw new BadRequestException('Customer Already subscribed');
      }
      const subscription = await this.stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [
          {
            price: createSubscriptionRequest.yearlySubscription
              ? yearlyPriceId
              : monthlyPriceId,
            quantity: createSubscriptionRequest.cardAmount,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice,
      };
    } catch (error) {
      throw new BadRequestException(
        'Error creating subscription',
        error.message,
      );
    }
  }

  async upgradeMonthlySubscription(
    createSubscriptionRequest: CreateSubscriptionRequest,
    user: User,
  ) {
    try {
      const monthlyPriceId = process.env.MONTHLY_SUBSCRIPTION_PRICE_ID;
      const yearlyPriceId = process.env.YEARLY_SUBSCRIPTION_PRICE_ID;

      const subscription = await this.stripe.subscriptions.retrieve(
        user.subscriptionId,
      );

      const updatedSubscription = await this.stripe.subscriptions.update(
        user.subscriptionId,
        {
          cancel_at_period_end: false,
          items: [
            {
              id: subscription.items.data[0].id,
              price: createSubscriptionRequest.yearlySubscription
                ? yearlyPriceId
                : monthlyPriceId,
              quantity: createSubscriptionRequest.cardAmount,
            },
          ],
          proration_behavior: 'always_invoice',
        },
      );
      return { updatedSubscription };
    } catch (error) {
      if (error?.code === StripeError.ResourceMissing) {
        throw new BadRequestException('Credit card not set up', error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async constructEventFromPayload(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  async processSubscriptionUpdate(event) {
    try {
      const data = event.data.object;
      const customerId: string = data.customer as string;
      const subscriptionStatus = data.status;

      switch (event.type) {
        case 'customer.subscription.updated':
          this.updateMonthlySubscriptionStatus(
            customerId,
            subscriptionStatus,
            data.quantity,
          );
          break;
        case 'customer.subscription.created':
          this.newMonthlySubscriptionStatus(
            customerId,
            data,
            subscriptionStatus,
          );
          break;
        case 'customer.subscription.deleted':
          this.updateMonthlySubscriptionStatus(customerId, subscriptionStatus);
          this.sendCancellationEmail(data);
          break;
        case 'invoice.payment_succeeded':
          await this.sendSubscriptionInvoiceEmail(data);
          await this.setCardToDefault(data);
          break;
        default:
          break;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePaymentMethod(user: User) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        user.subscriptionId,
        {
          payment_settings: {
            payment_method_types: ['card'],
          },
        },
      );
      return subscription;
    } catch (e) {
      throw new BadRequestException('Error updating payment method', e.message);
    }
  }

  async setCardToDefault(data: any) {
    try {
      const subscription_id = data['subscription'];
      const payment_intent_id = data['payment_intent'];

      const payment_intent = await this.stripe.paymentIntents.retrieve(
        payment_intent_id,
      );
      return await this.stripe.subscriptions.update(subscription_id, {
        default_payment_method: payment_intent['payment_method'] as string,
      });
    } catch (error) {
      throw new BadRequestException(
        'Error setting default card',
        error.message,
      );
    }
  }

  async cancelMonthlySubscription(user: User) {
    try {
      return await this.stripe.subscriptions.del(user.subscriptionId);
    } catch (error) {
      if (error?.code === StripeError.ResourceMissing) {
        throw new BadRequestException(
          'Error cancelling subscription',
          error.message,
        );
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async billingPortal(user: User) {
    try {
      return await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/subscription`,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Private methods
  private async listSubscriptions(priceId: string, stripeCustomerId: string) {
    try {
      return this.stripe.subscriptions.list({
        customer: stripeCustomerId,
        price: priceId,
        expand: ['data.latest_invoice', 'data.latest_invoice.payment_intent'],
      });
    } catch (error) {
      throw new BadRequestException(
        'error listing subscription',
        error.message,
      );
    }
  }

  private async newMonthlySubscriptionStatus(
    customerId: string,
    data: any,
    monthlySubscriptionStatus: string,
  ) {
    const user = await this.userModel.findOne({ stripeCustomerId: customerId });
    if (user) {
      await user.updateOne({
        monthlySubscriptionStatus,
        availableCardSlots: data.quantity,
        cardSlots: data.quantity,
        subscriptionId: data.id,
      });
      await user.save();
    }
  }

  private async updateMonthlySubscriptionStatus(
    customerId: string,
    monthlySubscriptionStatus: string,
    cardSlots?: number,
  ) {
    const user = await this.userModel.findOne({ stripeCustomerId: customerId });
    if (user) {
      const newCardCount = cardSlots - user.cardSlots;
      await user.updateOne({
        monthlySubscriptionStatus,
        availableCardSlots: cardSlots
          ? user.availableCardSlots + newCardCount
          : user.availableCardSlots,
        cardSlots: cardSlots ? user.cardSlots + newCardCount : user.cardSlots,
      });
      await user.save();
    }
  }

  private async sendSubscriptionInvoiceEmail(data: any) {
    const amountPaid = (data.total / 100).toString();
    const quantity = data.lines.data[0].quantity.toString();
    const nextBillDate = new Date(
      data.lines.data[0].period.end * 1000,
    ).toLocaleDateString('en-GB');

    switch (data.billing_reason) {
      case 'subscription_create':
        await this.mailSenderService.sendNewSubscriptionEmail(
          data.customer_name.split(' ')[0],
          data.customer_email,
          amountPaid,
          quantity,
          nextBillDate,
          data.invoice_pdf,
        );
        break;
      case 'subscription_update':
        await this.mailSenderService.sendSubscriptionUpdateEmail(
          data.customer_name.split(' ')[0],
          data.customer_email,
          amountPaid,
          quantity,
          nextBillDate,
          data.invoice_pdf,
        );
        break;
      default:
        break;
    }
  }

  private async sendCancellationEmail(data: any) {
    const user = await this.userModel.findOne({
      stripeCustomerId: data.customer,
    });

    await this.mailSenderService.sendSubscriptionCancellationEmail(
      user.firstName,
      user.email,
    );
  }
}
