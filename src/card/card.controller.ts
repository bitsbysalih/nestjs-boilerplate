import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Render,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cards, Users } from '@prisma/client';
import { GetUser } from 'src/auth/auth.decorator';
import { JwtAuthGuard } from '../auth/jwt-guard.guard';

//Services imports
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('Card')
@Controller({ path: 'card', version: '1' })
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'logoImage', maxCount: 1 },
      { name: 'backgroundImage', maxCount: 1 },
      //   { name: 'cardBody', maxCount: 1 },
    ]),
  )
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createCardDto: CreateCardDto,
    @GetUser() user: Users,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
      backgroundImage?: Express.Multer.File;
      cardBody?: Express.Multer.File;
    },
  ) {
    return await this.cardService.create(user, createCardDto, files);
  }

  @Put(':id/edit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardImage', maxCount: 1 },
      { name: 'logoImage', maxCount: 1 },
      { name: 'backgroundImage', maxCount: 1 },
    ]),
  )
  @UseGuards(JwtAuthGuard)
  async editCard(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
      backgroundImage?: Express.Multer.File;
    },
  ) {
    return await this.cardService.editCard(id, updateCardDto, files);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllUsersCards(@GetUser() user: Users): Promise<Cards[]> {
    return await this.cardService.getAllUsersCards(user);
  }

  @Get('view')
  @Render('card/card-scene')
  async root(@Query('id') id: string) {
    const card = await this.cardService.getCard(id);
    return { card: card, marker: card.marker.markerFile };
  }

  @Get(':id/details')
  async getCard(@Param('id') id: string) {
    return await this.cardService.getCard(id);
  }

  @Delete(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteCard(@Param('id') id: string) {
    return await this.cardService.deleteCard(id);
  }

  @Post('marker')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'markerImage', maxCount: 1 },
      { name: 'markerFile', maxCount: 1 },
    ]),
  )
  async markerUpload(
    @GetUser() user: Users,
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
  ) {
    return await this.cardService.markerUpload(user, files);
  }

  @Post('/mobile-marker-upload')
  @ApiOperation({
    summary: 'Uploads markers From mobile',
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
    return this.cardService.mobileMarkerUpload(userId, files);
  }

  @Get('marker')
  @UseGuards(JwtAuthGuard)
  async getAllMarkers(@GetUser() user: Users) {
    return await this.cardService.getAllMarkers(user);
  }
}
