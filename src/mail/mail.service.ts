import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { confirmMail } from './templates/confirm-mail.html';

@Injectable()
export class MailService {
  private transporter: Mail;
  private socials: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.password'),
      },
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
    });
    this.socials = this.configService
      .get('mail.socials')
      .map(
        (social) =>
          `<a href="${social[1]}" style="box-sizing:border-box;color: green;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px" target="_blank">${social[0]}</a>`,
      )
      .join('');
  }

  async sendOtpEmail(
    name: string,
    email: string,
    otp: string,
  ): Promise<boolean> {
    const mail = confirmMail
      .replace(new RegExp('--PersonName--', 'g'), name)
      //   .replace(new RegExp('--CompanyName--', 'g'), config.project.company)
      //   .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
      //   .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
      //   .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
      //   .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
      //   .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
      //   .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
      //   .replace(new RegExp('--Socials--', 'g'), this.socials)
      .replace(new RegExp('--email--', 'g'), email)
      .replace(new RegExp('--Otp--', 'g'), otp);
    //   .replace(
    //     new RegExp('--TermsOfServiceLink--', 'g'),
    //     config.project.termsOfServiceUrl,
    //   );

    const mailOptions = {
      from: `"${this.configService.get(
        'mail.defaultName',
      )}" <${this.configService.get('mail.defaultEmail')}>`,
      to: email, // list of receivers (separated by ,)
      subject: `Welcome to Sailspad ${name}`,
      html: mail,
    };

    return new Promise<boolean>((resolve) =>
      this.transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          this.logger.error(
            'Mail sending failed, check your service credentials.',
            error,
          );
          console.log(error);
          resolve(false);
        }
        resolve(true);
      }),
    );
  }
}
