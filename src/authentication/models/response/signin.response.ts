export class LoginResponse {
  token: string;
  refreshToken: string;
  subscriptionStatus: string;
  id?: string;
  email?: string;

  constructor(
    token: string,
    refreshToken: string,
    subscriptionStatus: string,
    id?: string,
    email?: string,
  ) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.subscriptionStatus = subscriptionStatus;
    this.id = id;
    this.email = email;
  }
}
