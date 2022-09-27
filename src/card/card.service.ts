import { BadRequestException, Injectable, UploadedFiles } from '@nestjs/common';
import { Cards, Users } from '@prisma/client';
import { customAlphabet } from 'nanoid';

//service imports
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma.service';

//DTO imports
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}
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

      const cardImageLink = await this.storageService.uploadFile(
        files.cardImage[0],
      );

      if (files.backgroundImage) {
        backgroundImageLink = await this.storageService.uploadFile(
          files.backgroundImage[0],
        );
      }
      if (files.logoImage) {
        logoImageLink = await this.storageService.uploadFile(
          files.logoImage[0],
        );
      }
      const marker = await this.prisma.markers.findFirst({});
      const newCard = await this.prisma.cards.create({
        data: {
          ...createCardDto,
          cardImage: cardImageLink,
          backgroundImage: backgroundImageLink,
          logoImage: logoImageLink,
          activeStatus: Boolean(createCardDto.activeStatus) || true,
          uniqueId: nanoid(),
          shortName: nanoid(),
          userId: user.id,
          marker: createCardDto.marker
            ? {
                uniqueId: createCardDto.marker.uniqueId,
                markerFile: createCardDto.marker.markerFile,
                markerImage: createCardDto.marker.markerImage,
              }
            : {
                uniqueId: marker.uniqueId,
                markerFile: marker.markerFile,
                markerImage: marker.markerImage,
              },
        },
      });
      await this.reduceCardCount(user.id, user.availableCardSlots - 1);
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
        cardImageLink = await this.storageService.uploadFile(
          files.cardImage[0],
        );
      }
      if (files.backgroundImage) {
        backgroundImageLink = await this.storageService.uploadFile(
          files.backgroundImage[0],
        );
      }
      if (files.logoImage) {
        logoImageLink = await this.storageService.uploadFile(
          files.logoImage[0],
        );
      }
      const cardToUpdate = await this.prisma.cards.update({
        where: { id },
        data: {
          ...updateCardDto,
          activeStatus: updateCardDto.activeStatus,
          cardImage: cardImageLink && cardImageLink,
          backgroundImage: backgroundImageLink && backgroundImageLink,
          logoImage: logoImageLink && logoImageLink,
        },
      });
      return cardToUpdate;
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
        files.markerFile[0],
      );
      const imageName = await this.storageService.uploadFile(
        files.markerImage[0],
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
        files.markerFile[0],
      );
      const imageName = await this.storageService.uploadFile(
        files.markerImage[0],
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

  async reduceCardCount(id: string, newCount: number) {
    try {
      await this.prisma.users.update({
        where: { id },
        data: { availableCardSlots: newCount },
      });
    } catch (error) {}
  }
}
