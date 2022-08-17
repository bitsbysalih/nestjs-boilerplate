import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { Card } from 'src/cards/schemas/card.schema';

import config from '../config';
import {
  //   changeMail,
  //   changePasswordInfo,
  confirmMail,
  confirmCardDetails,
  confirmCardEdit,
  confirmCardDeletion,
  newCardEmail,
  subscriptionInfoMail,
  subscriptionUpdateMail,
  subscriptionCancellationMail,
  cardListRequestMail,
  //   resetPassword,
} from './templates';

@Injectable()
export class MailSenderService {
  private transporter: Mail;
  private socials: string;
  private logger = new Logger('MailSenderService');

  constructor() {
    this.transporter = createTransport({
      auth: {
        user: config.mail.service.user,
        pass: config.mail.service.pass,
      },
      host: config.mail.service.host,
      port: config.mail.service.port,
      secure: config.mail.service.secure,
    });
    this.socials = config.project.socials
      .map(
        (social) =>
          `<a href="${social[1]}" style="box-sizing:border-box;color:${config.project.color};font-weight:400;text-decoration:none;font-size:12px;padding:0 5px" target="_blank">${social[0]}</a>`,
      )
      .join('');
  }

  async sendVerifyEmailMail(
    name: string,
    email: string,
    otp: string,
  ): Promise<boolean> {
    const mail = confirmMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--Otp--', 'g'), otp)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Welcome to ${config.project.name} ${name}! Confirm Your Email`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendVerifyEmailMailToAdmin(
    name: string,
    email: string,
    token: string,
    password: string,
  ): Promise<boolean> {
    const buttonLink = `${config.project.mailVerificationUrl}?token=${token}`;

    const mail = confirmMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--password--', 'g'), password)
      .replace(new RegExp('--ButtonLink--', 'g'), buttonLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: 'team@beyin.me', // list of receivers (separated by ,)
      subject: `Welcome to ${config.project.name} ${name}! Confirm Your Email`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendConfirmCardDetailsMail(
    name: string,
    email: string,
    card: Card,
  ): Promise<boolean> {
    const buttonLink = `${config.project.confirmCardDetailslUrl}/${card.shortName}`;
    const cardLinks = card.links
      .map(
        (link) =>
          `<a href="${link.link}" style="box-sizing:border-box;color:${
            config.project.color
          };font-weight:700;text-decoration:none;font-size:16px;padding:0 5px" target="_blank">${link.name.toUpperCase()}</a>`,
      )
      .join('');
    const mail = confirmCardDetails
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--ButtonLink--', 'g'), buttonLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      )
      .replace(new RegExp('--NameOnCard--', 'g'), card.name)
      .replace(new RegExp('--TitleOnCard--', 'g'), card.title)
      .replace(new RegExp('--AboutOnCard--', 'g'), card.about)
      .replace(new RegExp('--EmailOnCard--', 'g'), card.email)
      .replace(
        new RegExp('--ShortLinkOnCard--', 'g'),
        `https://cards.sailspad.com/${card.shortName}`,
      )
      .replace(new RegExp('--LinksOnCard--', 'g'), cardLinks);

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Card Confirmation for ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendConfirmCardEditMail(
    name: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    const buttonLink = `${config.project.cardEditVerificationUrl}?token=${token}`;

    const mail = confirmCardEdit
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--ButtonLink--', 'g'), buttonLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Card Edit request for ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendConfirmCardDeletionMail(
    name: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    const buttonLink = `${config.project.cardDeleteVerificationUrl}?token=${token}`;

    const mail = confirmCardDeletion
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--ButtonLink--', 'g'), buttonLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Card Deletion request for ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendConfirmCardEmailEditMail(
    name: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    const buttonLink = `${config.project.cardEmailEditVerificationUrl}?token=${token}`;

    const mail = confirmCardDeletion
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--ButtonLink--', 'g'), buttonLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Card Email Edit request for ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }
  async sendConfirmCardNewEmail(name: string, email: string): Promise<boolean> {
    const mail = newCardEmail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Email Successfully Changed for ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendNewSubscriptionEmail(
    name: string,
    email: string,
    amountPaid: string,
    quantity: string,
    nextBillDate: string,
    invoiceLink: string,
  ): Promise<boolean> {
    const mail = subscriptionInfoMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--AmountPaid--', 'g'), amountPaid)
      .replace(new RegExp('--Quantity--', 'g'), quantity)
      .replace(new RegExp('--NextBillDate--', 'g'), nextBillDate)
      .replace(new RegExp('--InvoiceLink--', 'g'), invoiceLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `${config.project.name} subscription successful`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendSubscriptionUpdateEmail(
    name: string,
    email: string,
    amountPaid: string,
    quantity: string,
    nextBillDate: string,
    invoiceLink: string,
  ): Promise<boolean> {
    const mail = subscriptionUpdateMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--AmountPaid--', 'g'), amountPaid)
      .replace(new RegExp('--Quantity--', 'g'), quantity)
      .replace(new RegExp('--NextBillDate--', 'g'), nextBillDate)
      .replace(new RegExp('--InvoiceLink--', 'g'), invoiceLink)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `${config.project.name} subscription upgraded`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }
  async sendSubscriptionCancellationEmail(
    name: string,
    email: string,
  ): Promise<boolean> {
    const mail = subscriptionCancellationMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `${config.project.name} subscription cancelled`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }

  async sendCardListEmail(
    name: string,
    email: string,
    link: string,
  ): Promise<boolean> {
    const mail = cardListRequestMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--SheetLink--', 'g'), link)
      .replace(
        new RegExp('--TermsOfServiceLink--', 'g'),
        config.project.termsOfServiceUrl,
      );

    const mailOptions = {
      from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
      to: email, // list of receivers (separated by ,)
      subject: `${config.project.name} cards list download`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.warn(
            'Mail sending failed, check your service credentials.',
          );
          resolve(false);
        }
        resolve(true);
      }),
    );
  }
}
