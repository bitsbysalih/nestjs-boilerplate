import {
  Body,
  Controller,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
  //   Inject,
  //   LoggerService,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Users } from '@prisma/client';
// import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GetUser } from './auth.decorator';
//Service imports
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './jwt-guard.guard';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService, // @Inject(WINSTON_MODULE_NEST_PROVIDER) // private readonly logger: LoggerService,
  ) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Creates new User',
  })
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async signup(
    @Body() signUpDto: SignUpDto,
    @UploadedFile() profilePhoto?: Express.Multer.File,
  ) {
    // this.logger.log('Creating new user', { controller: AuthController.name });
    return await this.authService.signup(signUpDto, profilePhoto);
  }

  @Get('resend-otp')
  @UseGuards(JwtAuthGuard)
  async resendOtp(@GetUser() user: Users) {
    // this.logger.log('Sending new otp');
    return await this.authService.resendOtp(user);
  }

  @Post('signin')
  async signin(@Body() loginDto: LoginDto) {
    // this.logger.log('logging in user', { controller: AuthController.name });
    return await this.authService.signin(loginDto);
  }

  @Post('validate-email')
  async validateOtp(@Query('token') token: string) {
    // this.logger.log('Verifying email');
    return await this.authService.validateEmail(token);
  }

  @Post('check-email')
  async checkEmail(@Query('email') email: string) {
    // this.logger.log('Verifying email');
    return await this.authService.checkEmail(email);
  }

  @Post('forgot-password')
  async forgotPassword(@Query('email') email: string) {
    // this.logger.log('Verifying email');
    return await this.authService.forgotPassword(email);
  }
}
