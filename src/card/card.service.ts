import {
  BadRequestException,
  ConflictException,
  Injectable,
  UploadedFiles,
} from '@nestjs/common';
import { Cards, Users } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
// import { utils, write } from 'xlsx';
import * as dataUriToBuffer from 'data-uri-to-buffer';
import toStream = require('buffer-to-stream');

//service imports
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma.service';

//DTO imports
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CheckShortNameDto } from './dto/check-short-name.dto';

@Injectable()
export class CardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  async create(
    user: Users,
    createCardDto: CreateCardDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
      backgroundImage?: Express.Multer.File;
    },
  ): Promise<Cards> {
    try {
      const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUV', 5);

      let backgroundImageLink: string;
      let logoImageLink: string;
      let cardImageLink: string;

      //Checks if card image file object or data uri string was uploaded
      if (files.cardImage) {
        //uploads file buffer to cloudinary and adds 50px radius transform to image
        cardImageLink = (await this.uploadImageToCloudinary(files.cardImage[0]))
          .secure_url;
      } else {
        //uploads data uri to cloudinary
        await v2.uploader
          .upload(createCardDto.cardImage, {
            transformation: [{ radius: 50 }],
            format: 'png',
            secure: true,
          })
          .then((result) => (cardImageLink = result.secure_url));
      }

      //Checks if background image file object or data uri string was uploaded
      if (files.backgroundImage) {
        //uploads file buffer to aws
        backgroundImageLink = await this.storageService.uploadFile(
          files.backgroundImage[0].buffer,
          files.backgroundImage[0].mimetype,
        );
      } else {
        //converts data uri to buffer then uploads to aws
        if (createCardDto.backgroundImage) {
          const cardImageBuffer = dataUriToBuffer(
            createCardDto.backgroundImage,
          );
          backgroundImageLink = await this.storageService.uploadFile(
            cardImageBuffer,
            cardImageBuffer.type,
          );
        }
      }

      //Checks if logo image file object or data uri string was uploaded
      if (files.logoImage) {
        //uploads file buffer to aws
        logoImageLink = await this.storageService.uploadFile(
          files.logoImage[0].buffer,
          files.logoImage[0].mimetype,
        );
      } else {
        if (createCardDto.logoImage) {
          //converts data uri to buffer then uploads to aws
          const cardImageBuffer = dataUriToBuffer(createCardDto.logoImage);
          logoImageLink = await this.storageService.uploadFile(
            cardImageBuffer,
            cardImageBuffer.type,
          );
        }
      }
      const parsedMarkerData =
        typeof createCardDto?.marker !== 'object' &&
        JSON.parse(createCardDto?.marker);
      const marker = await this.prisma.markers.findFirst({});
      const newCard = await this.prisma.cards.create({
        data: {
          ...createCardDto,
          links: Array.isArray(createCardDto.links)
            ? createCardDto.links
            : JSON.parse(createCardDto.links),
          email: createCardDto.email ? createCardDto.email : user.email,
          cardImage: cardImageLink,
          backgroundImage: backgroundImageLink,
          logoImage: logoImageLink,
          activeStatus: Boolean(createCardDto.activeStatus) || true,
          uniqueId: nanoid(),
          shortName: createCardDto.shortName || nanoid(),
          userId: user.id,
          marker: createCardDto.marker
            ? typeof createCardDto?.marker === 'object'
              ? {
                  uniqueId: createCardDto.marker.uniqueId,
                  markerFile: createCardDto.marker.markerFile,
                  markerImage: createCardDto.marker.markerImage,
                }
              : {
                  uniqueId: parsedMarkerData.uniqueId,
                  markerFile: parsedMarkerData.markerFile,
                  markerImage: parsedMarkerData.markerImage,
                }
            : {
                uniqueId: marker.uniqueId,
                markerFile: marker.markerFile,
                markerImage: marker.markerImage,
              },
        },
      });
      await this.changeCardCount(user.id, user.availableCardSlots - 1);
      return newCard;
    } catch (error) {
      console.log(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async editCard(
    id: string,
    updateCardDto: UpdateCardDto,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
      backgroundImage?: Express.Multer.File;
    },
  ) {
    try {
      let backgroundImageLink: string;
      let logoImageLink: string;
      let cardImageLink: string;

      if (files.cardImage) {
        cardImageLink = (await this.uploadImageToCloudinary(files.cardImage[0]))
          .secure_url;
      } else {
        //Checks if card image has been updated before changing it
        if (updateCardDto.cardImage?.startsWith('data:')) {
          await v2.uploader
            .upload(updateCardDto.cardImage, {
              transformation: [{ radius: 50 }],
              format: 'png',
              secure: true,
            })
            .then((result) => (cardImageLink = result.secure_url));
        }
      }

      if (files.backgroundImage) {
        backgroundImageLink = await this.storageService.uploadFile(
          files.backgroundImage[0].buffer,
          files.backgroundImage[0].mimetype,
        );
      } else {
        if (updateCardDto.backgroundImage?.startsWith('data:')) {
          //converts data uri to buffer then uploads to aws
          const cardImageBuffer = dataUriToBuffer(
            updateCardDto.backgroundImage,
          );
          backgroundImageLink = await this.storageService.uploadFile(
            cardImageBuffer,
            cardImageBuffer.type,
          );
        }
      }

      if (files.logoImage) {
        logoImageLink = await this.storageService.uploadFile(
          files.logoImage[0].buffer,
          files.logoImage[0].mimetype,
        );
      } else {
        if (updateCardDto.logoImage?.startsWith('data:')) {
          //converts data uri to buffer then uploads to aws
          const cardImageBuffer = dataUriToBuffer(updateCardDto.logoImage);
          logoImageLink = await this.storageService.uploadFile(
            cardImageBuffer,
            cardImageBuffer.type,
          );
        }
      }

      const parsedMarkerData =
        typeof updateCardDto?.marker !== 'object' &&
        JSON.parse(updateCardDto?.marker);
      const cardToUpdate = await this.prisma.cards.update({
        where: { id },
        data: {
          ...updateCardDto,
          links: Array.isArray(updateCardDto.links)
            ? updateCardDto.links
            : JSON.parse(updateCardDto.links),
          activeStatus: updateCardDto.activeStatus == 'true' ? true : false,
          cardImage: cardImageLink && cardImageLink,
          backgroundImage: backgroundImageLink && backgroundImageLink,
          logoImage: logoImageLink && logoImageLink,
          marker:
            updateCardDto.marker && typeof updateCardDto?.marker === 'object'
              ? {
                  uniqueId: updateCardDto.marker.uniqueId,
                  markerFile: updateCardDto.marker.markerFile,
                  markerImage: updateCardDto.marker.markerImage,
                }
              : {
                  uniqueId: parsedMarkerData.uniqueId,
                  markerFile: parsedMarkerData.markerFile,
                  markerImage: parsedMarkerData.markerImage,
                },
        },
      });
      return cardToUpdate;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteCard(id: string, user: Users) {
    try {
      await this.prisma.cards.delete({ where: { id } });
      await this.changeCardCount(user.id, user.availableCardSlots + 1);
      return { cardDeleted: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllUsersCards(user: Users): Promise<Cards[]> {
    try {
      const cards = await this.prisma.cards.findMany({
        where: { userId: user.id },
      });
      return cards;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCard(id: string) {
    try {
      const card = await this.prisma.cards.findUnique({
        where: { id },
      });

      return card;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async isShortNameAvailable(checkShortNameDto: CheckShortNameDto) {
    try {
      const checkShortName = await this.prisma.cards.findUnique({
        where: { shortName: checkShortNameDto.shortName },
      });
      if (checkShortName) {
        throw new ConflictException('shortname already used');
      }
      return true;
    } catch (e) {
      throw new BadRequestException('Error checking shortname', e.message);
    }
  }

  async markerUpload(
    user: Users,
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
  ) {
    try {
      const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUV', 5);

      const fileName = await this.storageService.uploadFile(
        files.markerFile[0].buffer,
        files.markerFile[0].mimetype,
      );
      const imageName = await this.storageService.uploadFile(
        files.markerImage[0].buffer,
        files.markerImage[0].mimetype,
      );

      const marker = await this.prisma.markers.create({
        data: {
          markerFile: fileName,
          markerImage: imageName,
          uniqueId: nanoid(),
          userId: user.id,
        },
      });
      return marker;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMarker(id: string) {
    try {
      const markerToDelete = await this.prisma.markers.delete({
        where: { uniqueId: id },
      });
      return markerToDelete;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async mobileMarkerUpload(
    userId: string,
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
  ) {
    try {
      const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUV', 5);

      const fileName = await this.storageService.uploadFile(
        files.markerFile[0].buffer,
        files.markerFile[0].mimetype,
      );
      const imageName = await this.storageService.uploadFile(
        files.markerImage[0].buffer,
        files.markerImage[0].mimetype,
      );

      const marker = await this.prisma.markers.create({
        data: {
          markerFile: fileName,
          markerImage: imageName,
          uniqueId: nanoid(),
          userId: userId,
        },
      });
      return marker;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllMarkers(user: Users) {
    try {
      const filteredMarkers = [];
      const markers = await this.prisma.markers.findMany({
        where: { userId: user.id },
      });
      const cards = await this.prisma.cards.findMany({
        where: { userId: user.id },
      });

      if (cards.length > 0) {
        markers.filter((marker) => {
          cards.map((card) => {
            if (card.marker.uniqueId === marker.uniqueId) {
              if (
                filteredMarkers.find(
                  (filteredMarker) =>
                    filteredMarker.uniqueId === marker.uniqueId,
                )
              ) {
                return;
              } else {
                filteredMarkers.push({
                  uniqueId: marker.uniqueId,
                  markerFile: marker.markerFile,
                  markerImage: marker.markerImage,
                  isDeletable: false,
                });
              }
            } else {
              if (
                filteredMarkers.find(
                  (filteredMarker) =>
                    filteredMarker.uniqueId === marker.uniqueId,
                )
              ) {
                return;
              }
              filteredMarkers.push({
                uniqueId: marker.uniqueId,
                markerFile: marker.markerFile,
                markerImage: marker.markerImage,
                isDeletable: true,
              });
            }
          });
          return filteredMarkers;
        });
      } else {
        markers.map((marker) =>
          filteredMarkers.push({
            uniqueId: marker.uniqueId,
            markerFile: marker.markerFile,
            markerImage: marker.markerImage,
            isDeletable: true,
          }),
        );
        return filteredMarkers;
      }
      return filteredMarkers;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addCardAnalytics(id: string) {
    try {
      const data = await this.prisma.analytics.create({
        data: {
          cardId: id,
          readAt: new Date(),
        },
      });
      console.log(data);
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAnalyticsData(id: string) {
    try {
      const months = Array(12).fill(0);

      const data = await this.prisma.analytics.findMany({
        where: { cardId: id },
      });

      data.forEach((obj) => {
        const month = new Date(obj.readAt).getMonth();
        ++months[month];
      });
      return months;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async changeCardCount(id: string, newCount: number) {
    try {
      await this.prisma.users.update({
        where: { id },
        data: { availableCardSlots: newCount },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async uploadImageToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          transformation: [{ radius: 50 }],
          format: 'png',
          secure: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
