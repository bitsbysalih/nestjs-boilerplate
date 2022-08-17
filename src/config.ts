export default {
  jwt: {
    secretOrKey: process.env.JWT_SECRET,
    expiresIn: '365d',
  },
  // You can also use any other email sending services
  mail: {
    service: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
    senderCredentials: {
      name: 'Beyin Digital Technologies',
      email: 'noreply@beyin.me',
    },
  },

  // these are used in the mail templates
  project: {
    company: 'Beyin Digital Technologies',
    name: 'Extended Business Cards',
    address: 'Masdar City, Abu Dhabi',
    logoUrl:
      'https://res.cloudinary.com/salihudev/image/upload/v1655059739/Sailspad_1_lfgfw6.png',
    slogan:
      'The trademarks, logos, designs, services and the content appearing herein, is exclusively owned by Beyin Digital Technology Limited, and/or its licensors, and are protected. Any unauthorized use or reproduction or distribution, shall attract suitable action under applicable law.',
    color: '#123456',
    socials: [
      ['instagram', 'https://instagram.com/beyin.me'],
      ['linkedin', 'https://www.linkedin.com/company/beyin-tech/'],
      ['phone', 'tel:+971525886620'],
      ['support', 'mailto:support@beyin.me'],
    ],
    url: 'https://beyin.me',
    mailVerificationUrl: `${process.env.BASE_URL}/authentication/verify-email`,
    confirmCardDetailslUrl: `cards.beyin.me`,
    cardEditVerificationUrl: `${process.env.BASE_URL}/cards/approve-edit-request`,
    cardEmailEditVerificationUrl: `${process.env.BASE_URL}/cards/approve-email-edit-request`,
    cardDeleteVerificationUrl: `${process.env.BASE_URL}/cards/approve-delete-request`,
    mailChangeUrl: `${process.env.BASE_URL}/authentication/change-email`,
    resetPasswordUrl: `${process.env.BASE_URL}/reset-password`,
    termsOfServiceUrl: `https://beyin.me/terms`,
  },
};
