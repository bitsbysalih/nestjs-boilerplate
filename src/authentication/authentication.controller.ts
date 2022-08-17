import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Query,
  Render,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  // ApiBearerAuth,
  //   ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
//Service imports
import { AuthenticationService } from './authentication.service';
//Decorators imports
import { GetUser } from '../users/users.decorator';
import { AuthUser } from './auth-user';

//Request/Response Models imports
import { SignupRequest } from './models/request/signup.request';
import { SigninRequest } from './models/request/signin.request';
import { LoginResponse } from './models/response/signin.response';
import { CheckEmailResponse } from './models/response/check-email.response';
import { CheckEmailRequest } from './models/request/check-email.request';
import { AuthGuard } from '@nestjs/passport';
import { UserResponse } from 'src/users/models/response/user.response';
import { RefreshAccessTokenRequest } from './models/request/refresh-access-token.request';
import { CheckUsernameRequest } from './models/request/check-username.request';
import { CheckUsernameResponse } from './models/response/check-username.response';
import { SignupResponse } from './models/response/signup.response';
import { AccountDeletionRequest } from 'src/users/models/request/account-deletion.request';
import { MobileSignupRequest } from './models/request/mobile-signup.request';
import { ContactDetailsRequest } from './models/request/contact-details.request';

@ApiTags('Auth')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('/signup')
  @ApiOperation({
    summary: 'Creates new user account',
  })
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupRequest: SignupRequest) {
    const newUser = await this.authenticationService.signup(signupRequest);
    return new SignupResponse(
      newUser.token,
      newUser.refreshToken,
      newUser.firstName,
      newUser.lastName,
      newUser.stripeCustomerId,
      newUser.email,
    );
  }

  @Post('/mobile-signup')
  @ApiOperation({
    summary: 'Sign up route for mobile app',
  })
  @HttpCode(HttpStatus.CREATED)
  async mobileSignup(@Body() mobileSignupRequest: MobileSignupRequest) {
    const newUser = await this.authenticationService.mobileSignup(
      mobileSignupRequest,
    );
    return new SignupResponse(newUser.token, newUser.refreshToken);
  }

  @Post('/contact-details')
  @ApiOperation({ summary: 'recieves users contact details' })
  @UseGuards(AuthGuard())
  async contactDetails(
    @Body() contactDetailsRequest: ContactDetailsRequest,
    @GetUser() user: AuthUser,
  ) {
    return this.authenticationService.contactDetails(
      contactDetailsRequest,
      user,
    );
  }
  @Post('/check-email')
  @ApiOperation({
    summary: 'Checks Database for already existing account with same email',
  })
  @HttpCode(HttpStatus.OK)
  async checkEmailAvailability(
    @Body() checkEmailRequest: CheckEmailRequest,
  ): Promise<CheckEmailResponse> {
    const isAvailable = await this.authenticationService.isEmailAvailable(
      checkEmailRequest.email,
    );
    return new CheckEmailResponse(isAvailable);
  }

  @Post('/verify-email')
  @ApiOperation({
    summary:
      "Verifies user's account based on otp they recieved in provided email",
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('otp') otp: string) {
    return this.authenticationService.verifyEmail(otp);
  }

  @Post('/check-username')
  @ApiOperation({
    summary: 'Checks Database for already existing account with same username',
  })
  @HttpCode(HttpStatus.OK)
  async checkUsernameAvailability(
    @Body() checkEmailRequest: CheckUsernameRequest,
  ): Promise<CheckUsernameResponse> {
    const isAvailable = await this.authenticationService.isUsernameAvailable(
      checkEmailRequest.username,
    );
    return new CheckUsernameResponse(isAvailable);
  }

  @Post('/signin')
  @ApiOperation({
    summary:
      'Signs user in based on email or username along with provided password',
  })
  @HttpCode(HttpStatus.OK)
  async signin(@Body() siginRequest: SigninRequest): Promise<any> {
    const token = await this.authenticationService.signin(siginRequest);
    return new LoginResponse(
      token.token,
      token.refreshToken,
      token.subscriptionStatus,
      token.id,
      token.email,
    );
  }

  @Get('/user-details')
  @ApiOperation({
    summary: 'Returns user details based on json web token',
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  async getUserWithToken(@GetUser() user: AuthUser): Promise<UserResponse> {
    return this.authenticationService.getUserWithToken(user);
  }

  @Post('/refresh-access-token')
  @ApiOperation({
    summary: 'Provides new access token based on refresh token',
  })
  @HttpCode(HttpStatus.OK)
  //   @ApiOperation({ summary: 'Refresh access token with refresh token' })
  async refreshAcessToken(
    @Body() refreshAccessTokenRequest: RefreshAccessTokenRequest,
  ) {
    return await this.authenticationService.refreshAcessToken(
      refreshAccessTokenRequest,
    );
  }
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resends otp email' })
  @UseGuards(AuthGuard())
  async resendOtp(@GetUser() user: AuthUser) {
    return await this.authenticationService.resendOtp(user);
  }

  @Post('admin-sign-in')
  @UseGuards(AuthGuard())
  async adminSignIn(
    @GetUser() user: AuthUser,
    @Body() accountDeletionRequest: AccountDeletionRequest,
  ) {
    const token = await this.authenticationService.adminSignIn(
      user,
      accountDeletionRequest,
    );
    return new LoginResponse(
      token.token,
      token.refreshToken,
      token.subscriptionStatus,
    );
  }
}
