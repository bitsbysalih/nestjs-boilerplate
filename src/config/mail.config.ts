import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  port: parseInt(process.env.MAIL_PORT, 10),
  host: process.env.MAIL_HOST,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
  defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
  defaultName: process.env.MAIL_DEFAULT_NAME,
  ignoreTLS: process.env.MAIL_IGNORE_TLS,
  secure: process.env.MAIL_SECURE,
  requireTLS: process.env.MAIL_REQUIRE_TLS,
  socials: [
    ['instagram', 'https://instagram.com/beyin.me'],
    ['linkedin', 'https://www.linkedin.com/company/beyin-tech/'],
    ['phone', 'tel:+971525886620'],
    ['support', 'mailto:support@beyin.me'],
  ],
}));
