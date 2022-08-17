export class UserResponse {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cardSlots?: number;
  availableCardSlots?: number;
  stripeCustomerId?: string;
  role?: string[];
}
