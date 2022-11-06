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
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cards, Users } from '@prisma/client';

import { GetUser } from '../auth/auth.decorator';
import { JwtAuthGuard } from '../auth/jwt-guard.guard';

//Services imports
import { CardService } from './card.service';

//DTO imports
import { CheckShortNameDto } from './dto/check-short-name.dto';
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

  @Post('/check-short-name')
  async checkShortName(@Body() checkShortNameDto: CheckShortNameDto) {
    const isShortNameAvailable = await this.cardService.isShortNameAvailable(
      checkShortNameDto,
    );
    return isShortNameAvailable;
  }

  @Get('view')
  @Render('card/card-scene')
  async renderAr(@Query('id') id: string) {
    const card = await this.cardService.getCard(id);

    //send the response
    const filteredLinks = card.links.map((link) =>
      link.name === 'phone'
        ? { name: link.name, link: link.link.replace(/^/, 'tel:') }
        : link.name === 'email'
        ? { name: link.name, link: link.link.replace(/^/, 'mailto:') }
        : link,
    );
    return {
      id: card.id,
      name: card.name.length > 13 ? card.name.replace(' ', '\n') : card.name,
      title: card.title,
      cardImage: card.cardImage,
      nameOffset: card.name.length > 13 ? 1.2 : 1.2,
      about: card.about,
      aboutOffset: card.about.length <= 150 ? 0.1 : 0.3,
      links: filteredLinks,
      marker: card.marker.markerFile,
    };
  }

  @Get('view-mobile')
  @Render('card/card-scene-mobile')
  async renderArMobile(@Query('id') id: string) {
    const card = await this.cardService.getCard(id);

    const filteredLinks = card.links.map((link) =>
      link.name === 'phone'
        ? { name: link.name, link: link.link.replace(/^/, 'tel:') }
        : link.name === 'email'
        ? { name: link.name, link: link.link.replace(/^/, 'mailto:') }
        : link,
    );
    return {
      id: card.id,
      name: card.name.length > 13 ? card.name.replace(' ', '\n') : card.name,
      title: card.title,
      cardImage: card.cardImage,
      nameOffset: card.name.length > 13 ? 1.2 : 1.2,
      about: card.about,
      aboutOffset: card.about.length <= 150 ? 0.1 : 0.3,
      links: filteredLinks,
      marker: card.marker.markerFile,
    };
  }

  @Get(':id/save-to-contacts')
  async saveToContacts(@Res() res: any, @Param('id') id: string) {
    const card = await this.cardService.getCard(id);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vCardsJS = require('vcards-js');

    //create a new vCard
    const vCard = vCardsJS();

    //set properties
    vCard.firstName = card.name.split(' ')[0];
    vCard.lastName = card.name.split(' ')[1];
    vCard.photo.attachFromUrl(card.cardImage);
    vCard.email = card.email;
    const phoneNumber = card.links.find(
      (link) => link.name === 'phone' && link,
    );
    vCard.cellPhone = phoneNumber.link;
    vCard.logo.attachFromUrl(card.logoImage);

    res.set('Content-Type', `text/vcard; name="${card.name}.vcf"`);
    res.set('Content-Disposition', `inline; filename="${card.name}.vcf"`);

    //send the response
    res.send(vCard.getFormattedString());
  }

  @Get(':id/details')
  async getCard(@Param('id') id: string) {
    return await this.cardService.getCard(id);
  }

  @Delete(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteCard(@Param('id') id: string, @GetUser() user: Users) {
    return await this.cardService.deleteCard(id, user);
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

  @Post('/marker/:id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteMarker(@Param('id') id: string) {
    return await this.cardService.deleteMarker(id);
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
