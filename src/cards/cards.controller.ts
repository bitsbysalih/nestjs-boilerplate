import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Render,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  // ApiBearerAuth,
  //   ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { join } from 'path';
//Schemas imports
import { User } from 'src/users/schemas/user.schema';

//Decorators imports
import { GetUser } from 'src/users/users.decorator';

//Service imports
import { CardsService } from './cards.service';

//Request/Response model imports
import { CheckShortNameRequest } from './models/request/check-short-name.request';
import { CreateCardRequest } from './models/request/create-card.request';
import { DeleteCardTokenRequest } from './models/request/delete-card-token.request';
import { DeleteCardRequest } from './models/request/delete-card.request';
import { DeleteMarkerRequest } from './models/request/delete-marker.request';
import { EditCardTokenRequest } from './models/request/edit-card-token.request';
import { EditCardRequest } from './models/request/edit-card.request';
import { EmailEditRequest } from './models/request/email-edit-request';
import { EmailEditTokenRequest } from './models/request/email-edit-token.request';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('/check-short-name')
  async checkShortName(@Body() checkShortNameRequest: CheckShortNameRequest) {
    const isShortNameAvailable = await this.cardsService.isShortNameAvailable(
      checkShortNameRequest,
    );
    return isShortNameAvailable;
  }

  @Post('/create')
  @ApiOperation({
    summary: 'Creates new card',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'logoImage', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard())
  async createCard(
    @Body() createCardRequest: CreateCardRequest,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
    },
    @GetUser() user: User,
  ) {
    return this.cardsService.createCard(createCardRequest, user, files);
  }

  @Get('/approve-card')
  @Render('cards/approve-card')
  @ApiOperation({
    summary: 'Approves new card after recipient confirms email',
  })
  async approveCardRequest(
    @Query('token')
    token: string,
  ) {
    const cardApproved = await this.cardsService.approveNewCard(token);
    return {
      message: cardApproved.message,
      status: cardApproved.status,
      card: cardApproved.card,
      demoLink: cardApproved.demoLink,
    };
  }

  @Get('/:id/details')
  @ApiOperation({
    summary: 'Retrieves card based on provided ID',
  })
  async getCardDetails(@Param('id') id: string) {
    return this.cardsService.getCard(id);
  }

  @Post('/card-edit-request')
  @ApiOperation({
    summary: 'Sends request to cad owner for card edit',
  })
  @UseGuards(AuthGuard())
  async editCardRequest(
    @Body() editCardTokenRequest: EditCardTokenRequest,
    @GetUser() user: User,
  ) {
    return this.cardsService.editCardRequest(editCardTokenRequest, user);
  }

  @Get('/approve-edit-request')
  @Render('cards/approve-card-edit')
  @ApiOperation({
    summary: 'Approves card edit and sets timeframe for edit to a week',
  })
  async approveEditRequest(
    @Query('token')
    token: string,
  ) {
    const cardEditApproved = await this.cardsService.approveEditRequest(token);
    return {
      message: cardEditApproved.message,
      status: cardEditApproved.status,
      card: cardEditApproved.card,
    };
  }

  @Post('/:id/edit')
  @ApiOperation({
    summary: 'Edits card based on provided params',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'logoImage', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard())
  async editCard(
    @Body() editCardRequest: EditCardRequest,
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
    },
    @GetUser() user: User,
  ) {
    return this.cardsService.editCard(editCardRequest, id, user, files);
  }

  @Post('/card-deletion-request')
  @ApiOperation({
    summary: 'Sends request to card owner for card deletion',
  })
  @UseGuards(AuthGuard())
  async deleteCardRequest(
    @Body() deleteCardTokenRequest: DeleteCardTokenRequest,
    @GetUser() user: User,
  ) {
    return this.cardsService.deleteCardRequest(deleteCardTokenRequest, user);
  }

  @Get('/approve-delete-request')
  @Render('cards/approve-card-deletion')
  @ApiOperation({
    summary: 'Approves card deletion',
  })
  async approveDeleteRequest(
    @Query('token')
    token: string,
  ) {
    const cardDeleteApproved = await this.cardsService.approveDeleteRequest(
      token,
    );
    return {
      message: cardDeleteApproved.message,
      status: cardDeleteApproved.status,
      card: cardDeleteApproved.card,
    };
  }

  @Patch('/:id/delete')
  @ApiOperation({
    summary: 'Deletes card',
  })
  @UseGuards(AuthGuard())
  async deleteCard(@Param('id') id: string, @GetUser() user: User) {
    return this.cardsService.deleteCard(id, user);
  }

  @Post('/email-edit-request')
  @ApiOperation({
    summary: 'Sends request to card owner for email change',
  })
  @UseGuards(AuthGuard())
  async emailEditRequest(
    @Body() emailEditTokenRequest: EmailEditTokenRequest,
    @GetUser() user: User,
  ) {
    return this.cardsService.emailEditRequest(emailEditTokenRequest, user);
  }

  @Get('/approve-email-edit-request')
  @Render('cards/approve-email-edit')
  @ApiOperation({
    summary: 'Approves card email edit',
  })
  async approveEmailEdit(
    @Query('token')
    token: string,
  ) {
    const cardEmailEditApproved = await this.cardsService.approveEmailEdit(
      token,
    );
    return {
      message: cardEmailEditApproved.message,
      status: cardEmailEditApproved.status,
      card: cardEmailEditApproved.card,
    };
  }

  @Patch('/:id/email-edit')
  @ApiOperation({
    summary: 'Changes Card Email',
  })
  @UseGuards(AuthGuard())
  async editEmail(
    @Body() emailEditRequest: EmailEditRequest,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.cardsService.editEmail(emailEditRequest, id, user);
  }

  @Post('/marker-upload')
  @ApiOperation({
    summary: 'Uploads marker image and file to aws and stores in database',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'markerImage', maxCount: 1 },
      { name: 'markerFile', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard())
  async markerUpload(
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
    @GetUser() user: User,
  ) {
    return this.cardsService.markerUpload(user, files);
  }

  @Post('/mobile-marker-upload')
  @ApiOperation({
    summary: 'Uploads marker image and file to aws and stores in database',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'markerImage', maxCount: 1 },
      { name: 'markerFile', maxCount: 1 },
    ]),
  )
  async mobileMarkerUpload(
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
    @Query('userId') userId: string,
  ) {
    return this.cardsService.mobileMarkerUpload(userId, files);
  }

  @Get('/markers')
  @ApiOperation({
    summary: "Retrieves all markers associated with user's account",
  })
  @UseGuards(AuthGuard())
  async getAllUserMarkers(@GetUser() user: User) {
    return this.cardsService.getAllUserMarkers(user);
  }

  @Post('delete-marker')
  @ApiOperation({ summary: 'Delete marker' })
  @UseGuards(AuthGuard())
  async deleteMarker(
    @GetUser() user: User,
    @Body() deleteMarkerRequest: DeleteMarkerRequest,
  ) {
    return this.cardsService.deleteMarker(user, deleteMarkerRequest);
  }
  @Post('/get-card-list')
  @ApiOperation({
    summary:
      "Sends excel sheet to aws and email with generated aws link to user's email",
  })
  @UseGuards(AuthGuard())
  async getCardList(@GetUser() user: User) {
    return this.cardsService.getCardList(user);
  }
}
