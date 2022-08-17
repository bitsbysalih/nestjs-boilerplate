export class SignupResponse {
  token: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
  stripeCustomerId: string;
  email: string;

  constructor(
    token: string,
    refreshToken: string,
    firstName?: string,
    lastName?: string,
    stripeCustomerId?: string,
    email?: string,
  ) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.firstName = firstName;
    this.lastName = lastName;
    this.stripeCustomerId = stripeCustomerId;
    this.email = email;
  }
}
