//Package imports
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';
import { hotp } from 'otplib';
import * as moment from 'moment';

import { v2 } from 'cloudinary';

//Service imports
import { MailSenderService } from 'src/mail-sender/mail-sender.service';
import { JwtPayload } from './jwt-payload';
import { StripeService } from 'src/stripe/stripe.service';

//Request/Response model imports
import { SignupRequest } from './models/request/signup.request';
import { SigninRequest } from './models/request/signin.request';

//Schema imports
import { User, UserDocument } from 'src/users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

import { AuthUser } from './auth-user';
import { UserResponse } from 'src/users/models/response/user.response';
import { RefreshAccessTokenRequest } from './models/request/refresh-access-token.request';
import { AccountDeletionRequest } from 'src/users/models/request/account-deletion.request';
import { MobileSignupRequest } from './models/request/mobile-signup.request';
import { ContactDetailsRequest } from './models/request/contact-details.request';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private stripeService: StripeService,
    private readonly mailSenderService: MailSenderService,
  ) {
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async signup(signupRequest: SignupRequest) {
    try {
      const checkForExistingVerifiedUser = await this.userModel.findOne({
        email: signupRequest.email,
        verified: true,
      });
      if (checkForExistingVerifiedUser) {
        throw new Error('user with this email already exists');
      }
      const existingUnverifiedUser = await this.userModel.findOne({
        email: signupRequest.email,
        signupStep: 1,
      });
      if (existingUnverifiedUser) {
        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(signupRequest.password, salt);
        await existingUnverifiedUser.update({
          password: hashedPassword,
        });
        existingUnverifiedUser.save();

        const otp = await this.generateTwoFactorAuthenticationSecret(
          existingUnverifiedUser._id,
        );
        await this.mailSenderService.sendVerifyEmailMail(
          existingUnverifiedUser.firstName,
          existingUnverifiedUser.email,
          otp,
        );
        return await this.returnAccessTokens(existingUnverifiedUser);
      }
      const stripeCustomer = await this.stripeService.createCustomer(
        `${signupRequest.firstName} ${signupRequest.lastName}`,
        signupRequest.email,
      );
      const salt = bcrypt.genSaltSync(12);
      const hashedPassword = bcrypt.hashSync(signupRequest.password, salt);
      const createNewUser = await this.userModel.create({
        ...signupRequest,
        apiKey: nanoid(20),
        password: hashedPassword,
        stripeCustomerId: stripeCustomer.id,
        signupStep: 1,
      });
      await createNewUser.save();
      const otp = await this.generateTwoFactorAuthenticationSecret(
        createNewUser._id,
      );
      await this.mailSenderService.sendVerifyEmailMail(
        createNewUser.firstName,
        createNewUser.email,
        otp,
      );
      return await this.returnAccessTokens(createNewUser);
    } catch (e) {
      throw new ConflictException('Error Signing up user', e.message);
    }
  }

  async mobileSignup(mobileSignupRequest: MobileSignupRequest) {
    let profilePhotoUrl: string;
    try {
      const user = await this.userModel.findOne({
        email: mobileSignupRequest.email,
        verified: true,
      });
      if (user) {
        throw new ConflictException('user already exists');
      }
      await v2.uploader
        .upload(mobileSignupRequest.profilePhoto, {
          format: 'png',
          secure: true,
        })
        .then((result) => (profilePhotoUrl = result.secure_url));
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(
        mobileSignupRequest.password,
        salt,
      );
      const newUser = await this.userModel.create({
        ...mobileSignupRequest,
        password: hashedPassword,
        profilePhotoUrl,
      });
      const otp = await this.generateTwoFactorAuthenticationSecret(newUser._id);
      await this.mailSenderService.sendVerifyEmailMail(
        newUser.firstName,
        newUser.email,
        otp,
      );
      const payload: JwtPayload = {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      };

      return {
        token: await this.jwtService.signAsync(payload),
        refreshToken: await this.createRefreshToken(newUser.email),
      };
    } catch (error) {
      throw new BadRequestException('error creating user', error.message);
    }
  }

  async contactDetails(
    contactDetailsRequest: ContactDetailsRequest,
    user: User,
  ) {
    const foundUser = await this.userModel.findOne({ email: user.email });
    if (foundUser) {
      await foundUser.updateOne({
        links: JSON.parse(contactDetailsRequest.links),
      });
      return { message: 'user has been updated' };
    }
    return { message: 'user was not found' };
  }

  async signin(signinRequest: SigninRequest): Promise<any> {
    try {
      const existingUser = await this.userModel.findOne({
        email: signinRequest.identifier,
        verified: true,
      });

      if (
        !existingUser ||
        (await !bcrypt.compareSync(
          signinRequest.password,
          existingUser.password,
        ))
      ) {
        throw new NotFoundException('user not found');
      }

      const stripeCustomer = await this.stripeService.createCustomer(
        `${existingUser.firstName} ${existingUser.lastName}`,
        existingUser.email,
      );
      if (!existingUser.stripeCustomerId) {
        await existingUser.update({ stripeCustomerId: stripeCustomer.id });
        existingUser.save();
      }

      return await this.returnAccessTokens(existingUser);
    } catch (e) {
      throw new BadRequestException(e.response);
    }
  }

  async adminSignIn(
    user: User,
    accountDeletionRequest: AccountDeletionRequest,
  ) {
    if (user.role[1] !== 'admin') {
      throw new UnauthorizedException(
        "This user isn't authorised for this action",
      );
    }
    const foundUser = await this.userModel.findById(
      accountDeletionRequest.userId,
    );
    const payload: JwtPayload = {
      id: foundUser._id,
      email: foundUser.email,
      role: foundUser.role,
    };
    return {
      token: await this.jwtService.signAsync(payload),
      refreshToken: await this.createRefreshToken(foundUser.email),
      subscriptionStatus: foundUser.monthlySubscriptionStatus,
    };
  }

  async refreshAcessToken(
    refreshAccessTokenRequest: RefreshAccessTokenRequest,
  ) {
    const email = await this.findRefreshToken(
      refreshAccessTokenRequest.refreshToken,
    );
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Bad Request');
    }
    const payload: JwtPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    return {
      token: await this.jwtService.signAsync(payload),
    };
  }

  async getUserWithToken(user: User): Promise<UserResponse> {
    const foundUser = await this.userModel.findById(user._id);
    return foundUser;
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return user ? false : true;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.userModel.findOne({ username });
    return user ? false : true;
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userModel.findById(payload.id);
    if (user !== null && user.email === payload.email) {
      return user;
    }
    throw new UnauthorizedException();
  }

  async verifyEmail(otp: string) {
    try {
      const user = await this.userModel.findOne({
        otpToken: otp,
        verified: false,
      });
      if (user) {
        user.verified = true;
        user.signupStep = 2;
        await user.save();
        return {
          email: user.email,
          verified: user.verified,
        };
      }
    } catch (e) {
      throw new BadRequestException('Error verifying user', e.message);
    }
  }

  async resendOtp(user: User) {
    const otp = await this.generateTwoFactorAuthenticationSecret(user._id);
    await this.mailSenderService.sendVerifyEmailMail(
      user.firstName,
      user.email,
      otp,
    );
  }

  //Private Methods
  private async createRefreshToken(email: string) {
    const refreshToken = await this.refreshTokenModel.create({
      email,
      refreshToken: nanoid(),
    });
    await refreshToken.save();
    return refreshToken.refreshToken;
  }

  private async findRefreshToken(token: string) {
    const refreshToken = await this.refreshTokenModel.findOne({
      refreshToken: token,
    });

    if (!refreshToken) {
      throw new UnauthorizedException('User has been logged out');
    }
    return refreshToken.email;
  }

  private async generateTwoFactorAuthenticationSecret(id: string) {
    const user = await this.userModel.findById(id);

    const counter = moment().toDate().getTime();
    const secret = 'fef24ttf2f2';

    const otp = hotp.generate(secret, counter / 30);
    await user.update({ otpToken: otp });

    return otp;
  }

  private async returnAccessTokens(user: User) {
    const payload: JwtPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    return {
      token: await this.jwtService.signAsync(payload),
      refreshToken: await this.createRefreshToken(user.email),
      firstName: user.firstName,
      lastName: user.lastName,
      stripeCustomerId: user.stripeCustomerId,
      email: user.email,
      signupStep: user.signupStep,
    };
  }
}
