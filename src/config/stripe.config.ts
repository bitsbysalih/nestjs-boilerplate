import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SK,
  publishableKey: process.env.STRIPE_PK,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  monthlySubscriptionId: process.env.STRIPE_MONTHLY_SUBSCRIPTION_ID,
  yearlySubscriptionId: process.env.STRIPE_YEARLY_SUBSCRIPTION_ID,
}));
