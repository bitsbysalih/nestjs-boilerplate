import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  secret: process.env.AUTH_JWT_SECRET,
  expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
  otpSecret: process.env.AUTH_OTP_SECRET,
}));
