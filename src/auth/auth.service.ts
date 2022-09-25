import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UploadedFile,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  nanoid,
  // customAlphabet
} from 'nanoid';
import { totp } from 'otplib';

//DTO imports
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.payload';

//Service imports
import { StorageService } from '../storage/storage.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private storageService: StorageService,
    private stripeService: StripeService,
  ) {}

  //Takes user details and creates new account
  async signup(
    signUpDto: SignUpDto,
    @UploadedFile() profilePhoto?: Express.Multer.File,
  ) {
    try {
      let profilePhotoUrl: string;
      let user: Users;
      const existingUser = await this.prisma.users.findUnique({
        where: { email: signUpDto.email },
      });
      //   totp.options = {
      //     step: 300,
      //   };

      //   const shortCode = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUV', 5);

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = bcrypt.hashSync(signUpDto.password, salt);
      const stripeCustomerId = await this.stripeService.createCustomer(
        `${signUpDto.firstName.toUpperCase()} ${signUpDto.lastName.toUpperCase()}`,
        signUpDto.email,
      );

      const otpToken = totp.generate(this.configService.get('auth.otpSecret'));

      if (existingUser && existingUser.isEmailVerified) {
        throw new ConflictException('user with this email already exists');
      } else if (existingUser && !existingUser.isEmailVerified) {
        if (profilePhoto) {
          profilePhotoUrl = await this.storageService.uploadFile(profilePhoto);
        }
        user = await this.prisma.users.update({
          where: { email: signUpDto.email },
          data: {
            ...signUpDto,
            stripeCustomerId: stripeCustomerId.id,
            profilePhoto: profilePhotoUrl,
            otpToken,
            password: hashedPassword,
          },
        });
        await this.mailService.sendOtpEmail(
          user.firstName,
          user.email,
          otpToken,
        );
        return await this.returnAccountDetails(user);
      } else {
        if (profilePhoto) {
          profilePhotoUrl = await this.storageService.uploadFile(profilePhoto);
        }
        user = await this.prisma.users.create({
          data: {
            ...signUpDto,
            stripeCustomerId: stripeCustomerId.id,
            profilePhoto: profilePhotoUrl,
            otpToken,
            password: hashedPassword,
          },
        });

        //Create template marker
        await this.prisma.markers.create({
          data: {
            uniqueId: nanoid(),
            markerFile:
              'https://sailspad.fra1.digitaloceanspaces.com/targets%20%281%29.mind',
            markerImage:
              'https://sailspad.fra1.digitaloceanspaces.com/EF1CF178-2A3B-456B-9AA4-5F6243224A23.jpeg',
            userId: user.id,
          },
        });
      }

      await this.mailService.sendOtpEmail(user.firstName, user.email, otpToken);
      return await this.returnAccountDetails(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Signs in user
  async signin(loginDto: LoginDto) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          email: loginDto.email,
        },
      });

      if (!user || !user.isEmailVerified) {
        throw new NotFoundException('User not found');
      }
      if (!bcrypt.compareSync(loginDto.password, user.password)) {
        throw new UnauthorizedException('Password is incorrect');
      }
      return await this.returnAccountDetails(user);
    } catch (error) {
      throw new BadRequestException(error.response, error.message);
    }
  }

  //Validates user based on accessToken
  async validateUser(payload: JwtPayload): Promise<Users> {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.id },
    });
    if (user !== null && user.email === payload.email) {
      return user;
    }
    throw new UnauthorizedException();
  }

  async resendOtp(user: Users) {
    try {
      const newOtpToken = totp.generate(
        this.configService.get('auth.otpSecret'),
      );
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          otpToken: newOtpToken,
        },
      });
      await this.mailService.sendOtpEmail(
        user.firstName,
        user.email,
        newOtpToken,
      );
      return { newOtpSent: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateEmail(token: string) {
    try {
      if (await this.validateOtp(token)) {
        await this.prisma.users.update({
          where: { otpToken: token },
          data: {
            isEmailVerified: true,
          },
        });
      }
      return { isEmailVerified: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //Validates otp in all scenarios that need it
  async validateOtp(token: string) {
    try {
      const isValid = totp.check(
        token,
        this.configService.get('auth.otpSecret'),
      );
      if (isValid) {
        return true;
      }
      throw new UnauthorizedException('token is invalid');
    } catch (error) {
      throw new BadRequestException(error.response, error.message);
    }
  }
  // Sends new otp when it verifies refresh token
  async refreshAccessToken(token: string) {
    try {
      const foundToken = await this.prisma.refreshTokens.findUnique({
        where: {
          token,
        },
      });

      if (!foundToken) {
        throw new ConflictException('Bad token');
      }
      const user = await this.prisma.users.findUnique({
        where: { email: foundToken.email },
      });

      return this.returnAccountDetails(user);
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  async forgotPassword() {
    try {
      // find user account by id and send an otp
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  ////////////////////////////////
  //                            //
  //      Private Methods       //
  //                            //
  ////////////////////////////////

  //Creates refresh access token
  private async createRefreshToken(email: string) {
    const refreshToken = await this.prisma.refreshTokens.create({
      data: { email, token: nanoid() },
    });
    return refreshToken.token;
  }

  //Returns auth details on sign in and sign up and other auth related processes
  private async returnAccountDetails(user: Users) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };
    return {
      id: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      roles: user.roles,
      canAddLogo: user.canAddLogo,
      canAddBackground: user.canAddBackground,
      cardSlots: user.cardSlots,
      availableCardSlots: user.availableCardSlots,
      profilePhoto: user.profilePhoto,
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.createRefreshToken(user.email),
    };
  }
}
