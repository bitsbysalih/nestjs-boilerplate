import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UploadedFiles,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as AWS from 'aws-sdk';
import * as dataUriToBuffer from 'data-uri-to-buffer';
import { v2 } from 'cloudinary';
import { utils, write } from 'xlsx';

//Schema imports
import { Card, CardDocument } from './schemas/card.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { customAlphabet, nanoid } from 'nanoid';
import * as moment from 'moment';
import { addDays } from 'date-fns';

//Request/Response models imports
import { CreateCardRequest } from './models/request/create-card.request';
import { EditCardRequest } from './models/request/edit-card.request';
import { CheckShortNameRequest } from './models/request/check-short-name.request';
import { Marker, MarkerDocument } from './schemas/marker.schema';
import { EditToken, EditTokenDocument } from './schemas/edit-token.schema';

//Service imports
import { MailSenderService } from 'src/mail-sender/mail-sender.service';
import { EditCardTokenRequest } from './models/request/edit-card-token.request';
import { DeleteCardTokenRequest } from './models/request/delete-card-token.request';
import {
  DeleteToken,
  DeleteTokenDocument,
} from './schemas/deletion-token.schema';
import { EmailEditTokenRequest } from './models/request/email-edit-token.request';
import {
  EmailEditToken,
  EmailEditTokenDocument,
} from './schemas/email-edit-token.schema';
import { EmailEditRequest } from './models/request/email-edit-request';
import { link } from 'fs/promises';
import { DeleteMarkerRequest } from './models/request/delete-marker.request';

const generateShortName = customAlphabet('1234567890abcdef', 8);
const generateUniqueId = customAlphabet('1234567890abcdef', 5);

@Injectable()
export class CardsService {
  NUMBER_OF_EDITS = 10;
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });
  constructor(
    @InjectModel(Card.name) private cardModel: Model<CardDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Marker.name) private markerModel: Model<MarkerDocument>,
    @InjectModel(EditToken.name)
    private editTokenModel: Model<EditTokenDocument>,
    @InjectModel(DeleteToken.name)
    private deleteTokenModel: Model<DeleteTokenDocument>,
    @InjectModel(EmailEditToken.name)
    private emailEditTokenModel: Model<EmailEditTokenDocument>,

    private readonly mailSenderService: MailSenderService,
  ) {
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async createCard(
    createCardRequest: CreateCardRequest,
    user: User,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
    },
  ) {
    try {
      let cardImageLink: string;
      let cardLogoImage: string;
      let cardBackgroundLink: string;

      if (!user) {
        throw new UnauthorizedException('User not authorised');
      }
      await this.checkUserCardCount(user._id);

      if (createCardRequest.logoImage) {
        const cardImageBuffer = dataUriToBuffer(createCardRequest.logoImage);
        await v2.uploader
          .upload(createCardRequest.logoImage, {
            format: 'png',
            secure: true,
          })
          .then((result) => (cardLogoImage = result.secure_url));
      }
      if (createCardRequest.cardImage) {
        const cardImageBuffer = dataUriToBuffer(createCardRequest.cardImage);
        console.log(cardImageBuffer);
        await v2.uploader
          .upload(createCardRequest.cardImage, {
            transformation: [{ radius: 50 }],
            format: 'png',
            secure: true,
          })
          .then((result) => (cardImageLink = result.secure_url));
      }
      if (createCardRequest.cardBackgroundImage) {
        const cardImageBuffer = dataUriToBuffer(
          createCardRequest.cardBackgroundImage,
        );
        const cardBackgroundUpload = await this.s3_upload(
          cardImageBuffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          cardImageBuffer.type,
        );
        cardBackgroundLink = cardBackgroundUpload.Location;
      }

      const createdCard = await this.cardModel.create({
        ...createCardRequest,
        links: JSON.parse(createCardRequest.links),
        marker: JSON.parse(createCardRequest.marker),
        emailEditable: false,
        logoImageUrl:
          cardLogoImage ||
          'https://res.cloudinary.com/salihudev/image/upload/v1648944492/BEYIN_1_i4tzbs.svg',
        dateTillDeletion: addDays(moment().valueOf(), 365),
        createdAt: moment().valueOf(),
        editableUntil: addDays(moment().valueOf(), 7),
        user: user._id,
        uniqueId: generateUniqueId(),
        shortName: createCardRequest.shortName || generateShortName(),
        cardBackground: cardBackgroundLink || '',
        cardImage:
          cardImageLink ||
          'https://ebc-markers-and-images.s3.eu-central-1.amazonaws.com/images/mojtaba-mosayebzadeh-WvFy1eFAxjM-unsplash.jpg',
      });
      await createdCard.save();
      const reduceAvailableCards = await this.userModel.findById(user._id);
      await reduceAvailableCards.updateOne({
        availableCardSlots: user.availableCardSlots - 1,
      });
      await reduceAvailableCards.save();
      await this.mailSenderService.sendConfirmCardDetailsMail(
        createdCard.name,
        createdCard.email,
        createdCard,
      );
      return createdCard;
    } catch (e) {
      throw new BadRequestException('Error creating card', e.message);
    }
  }

  async approveNewCard(token: string) {
    try {
      const cardToApprove = await this.cardModel.findOne({ uniqueId: token });
      if (!cardToApprove) {
        throw new NotFoundException('Card not found');
      }
      await cardToApprove.updateOne({ activeStatus: true });
      await cardToApprove.save();
      return {
        message: 'New Card Activated',
        status: cardToApprove.activeStatus,
        card: cardToApprove,
        demoLink: `https://ebc.beyin.me/cards/${cardToApprove._id}/demo-view`,
      };
    } catch (e) {
      throw new BadRequestException('Error approving card', e.message);
    }
  }

  async getCard(id: string) {
    try {
      const card = await this.cardModel.findById(id);
      if (card.deleted) {
        throw new NotFoundException('Card not found or is inactive');
      }
      return { card };
    } catch (e) {
      throw new BadRequestException('Error getting card', e.message);
    }
  }

  async getUserCards(user: User) {
    try {
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const cards = await this.cardModel.find({
        user: user._id,
        deleted: false,
      });
      if (cards.length <= 0) {
        return { message: 'User has no cards' };
      }
      return cards;
    } catch (e) {
      throw new BadRequestException('Error getting cards');
    }
  }

  async editCard(
    editCardRequest: EditCardRequest,
    id: string,
    user: User,
    @UploadedFiles()
    files: {
      cardImage?: Express.Multer.File;
      logoImage?: Express.Multer.File;
      cardBackground?: Express.Multer.File;
    },
  ) {
    try {
      let cardImageLink: string;
      let cardLogoImage: string;
      let cardBackgroundLink: string;

      if (!user) {
        throw new UnauthorizedException('User not authorized');
      }
      const card = await this.cardModel.findById(id);
      if (!card) {
        throw new NotFoundException('Card not found');
      }

      if (editCardRequest.logoImage.startsWith('data:')) {
        // const cardImageBuffer = dataUriToBuffer(editCardRequest.logoImage);
        await v2.uploader
          .upload(editCardRequest.logoImage, {
            format: 'png',
            secure: true,
          })
          .then((result) => (cardLogoImage = result.secure_url));
        console.log(cardLogoImage);
      } else {
        cardLogoImage = editCardRequest.logoImage;
      }

      if (editCardRequest.cardBackgroundImage.startsWith('data:')) {
        const cardImageBuffer = dataUriToBuffer(
          editCardRequest.cardBackgroundImage,
        );
        const cardBackgroundUpload = await this.s3_upload(
          cardImageBuffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          cardImageBuffer.type,
        );
        cardBackgroundLink = cardBackgroundUpload.Location;
      } else {
        cardBackgroundLink = editCardRequest.cardBackgroundImage;
      }

      if (editCardRequest.cardImage.startsWith('data:')) {
        const cardImageBuffer = dataUriToBuffer(editCardRequest.cardImage);
        console.log(cardImageBuffer);
        await v2.uploader
          .upload(editCardRequest.cardImage, {
            transformation: [{ radius: 50 }],
            format: 'png',
            secure: true,
          })
          .then((result) => (cardImageLink = result.secure_url));
        console.log(cardImageLink);
      } else {
        cardImageLink = editCardRequest.cardImage;
      }

      if (
        card.editableUntil.valueOf() >= moment().valueOf() &&
        card.numberOfEdits < this.NUMBER_OF_EDITS &&
        card.editable === true
      ) {
        const cardToEdit = await this.cardModel.findById(card._id);
        await cardToEdit.updateOne(
          {
            ...editCardRequest,
            links: JSON.parse(editCardRequest.links),
            marker: JSON.parse(editCardRequest.marker),
            shortName: editCardRequest.shortName || generateShortName(),
            cardImage: cardImageLink || editCardRequest.cardImage,
            numberOfEdits: card.numberOfEdits + 1,
            cardBackground: cardBackgroundLink || cardToEdit.cardBackground,
            logoImageUrl: cardLogoImage || cardToEdit.logoImageUrl,
          },
          { new: true },
        );
        await cardToEdit.save();
        await this.mailSenderService.sendConfirmCardDetailsMail(
          card.name,
          card.email,
          card,
        );
        return card;
      } else {
        await card.updateOne({ editable: false });
        await card.save();
        return { message: 'Card editted recently or too many times' };
      }
    } catch (e) {
      throw new BadRequestException('Error Editing card', e.message);
    }
  }

  async isShortNameAvailable(checkShortNameRequest: CheckShortNameRequest) {
    try {
      const checkShortName = await this.cardModel.findOne({
        shortName: checkShortNameRequest.shortName,
      });
      if (checkShortName) {
        throw new ConflictException('shortname already used');
      }
      return true;
    } catch (e) {
      throw new BadRequestException('Error checking shortname', e.message);
    }
  }

  async editCardRequest(
    editCardTokenRequest: EditCardTokenRequest,
    user: User,
  ) {
    try {
      if (!user) {
        throw new UnauthorizedException('Not Authorised ');
      }
      const card = await this.cardModel.findById(editCardTokenRequest._id);
      if (!card) {
        throw new NotFoundException('Card was not found');
      }
      const newEditToken = await this.editTokenModel.create({
        editToken: nanoid(),
        card,
      });
      await newEditToken.save();
      await this.mailSenderService.sendConfirmCardEditMail(
        card.name,
        card.email,
        newEditToken.editToken,
      );
      return { message: 'Request has been sent' };
    } catch (e) {
      throw new BadRequestException('Error sending request', e.message);
    }
  }

  async approveEditRequest(token: string) {
    try {
      const findCardByToken = await this.editTokenModel.findOne({
        editToken: token,
      });
      if (!findCardByToken) {
        throw new NotFoundException('Token not found');
      }
      if (findCardByToken.tokenUsed) {
        return {
          message: 'Token already used',
          status: false,
        };
      }
      const cardToEdit = await this.cardModel.findById(findCardByToken.card);
      await cardToEdit.updateOne({
        editable: true,
        numberOfEdits: 0,
        editableUntil: addDays(moment().valueOf(), 7),
      });
      const setTokenToUsed = await this.editTokenModel.findOneAndUpdate(
        {
          editToken: token,
        },
        { tokenUsed: true },
      );
      await cardToEdit.save();
      await setTokenToUsed.save();
      return {
        message: 'Edit Request Approved',
        status: true,
        card: cardToEdit,
      };
    } catch (e) {
      throw new BadRequestException('Error approving reqeust', e.message);
    }
  }

  async markerUpload(
    user: User,
    @UploadedFiles()
    files: {
      markerImage?: Express.Multer.File;
      markerFile?: Express.Multer.File;
    },
  ) {
    try {
      let markerImageLink: string;
      let markerFileLink: string;
      if (!user) {
        throw new UnauthorizedException('Not authorised');
      }
      if (files) {
        const markerPhotoUpload = await this.s3_upload(
          files.markerImage[0].buffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          files.markerImage[0].mimetype,
        );
        markerImageLink = markerPhotoUpload.Location;
        const markerFileUpload = await this.s3_upload(
          files.markerFile[0].buffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          files.markerFile[0].mimetype,
        );
        markerFileLink = markerFileUpload.Location;
        const newMarker = await this.markerModel.create({
          markerImageLink,
          markerFileLink,
          uniqueId: generateUniqueId(),
          user: user._id,
        });
        await newMarker.save();
        return { message: 'New marker uploaded', newMarker };
      }
    } catch (e) {
      throw new BadRequestException('Error uploading marker', e.message);
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
      let markerImageLink: string;
      let markerFileLink: string;
      if (!userId) {
        throw new UnauthorizedException('Not authorised');
      }
      if (files) {
        const markerPhotoUpload = await this.s3_upload(
          files.markerImage[0].buffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          files.markerImage[0].mimetype,
        );
        markerImageLink = markerPhotoUpload.Location;
        const markerFileUpload = await this.s3_upload(
          files.markerFile[0].buffer,
          this.AWS_S3_BUCKET,
          nanoid(8),
          files.markerFile[0].mimetype,
        );
        markerFileLink = markerFileUpload.Location;
        const newMarker = await this.markerModel.create({
          markerImageLink,
          markerFileLink,
          uniqueId: generateUniqueId(),
          user: userId,
        });
        await newMarker.save();
        return { message: 'New marker uploaded', newMarker };
      }
    } catch (e) {
      throw new BadRequestException('Error uploading marker', e.message);
    }
  }

  async getAllUserMarkers(user: User) {
    try {
      const markers = await this.markerModel.find({ user: user._id });
      const cards = await this.cardModel.find({ user: user._id });
      if (!markers) {
        return { message: 'user has no markers' };
      }
      const filteredMarkers = [];
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
                  markerFileLink: marker.markerFileLink,
                  markerImageLink: marker.markerImageLink,
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
                markerFileLink: marker.markerFileLink,
                markerImageLink: marker.markerImageLink,
                isDeletable: true,
              });
            }
          });
          return { markers: filteredMarkers };
        });
      } else {
        markers.map((marker) =>
          filteredMarkers.push({
            uniqueId: marker.uniqueId,
            markerFileLink: marker.markerFileLink,
            markerImageLink: marker.markerImageLink,
            isDeletable: true,
          }),
        );
        return { markers: filteredMarkers };
      }

      return { markers: filteredMarkers };
    } catch (e) {
      throw new BadRequestException('Error getting markers', e.message);
    }
  }

  async deleteMarker(user: User, deleteMarkerRequest: DeleteMarkerRequest) {
    try {
      const marker = await this.markerModel.deleteOne({
        uniqueId: deleteMarkerRequest.uniqueId,
      });
      if (!marker) {
        return "Marker wasn't found";
      }
      return 'Marker deleted successfully';
    } catch (error) {
      throw new BadRequestException('Error deleteing marker', error.message);
    }
  }

  async emailEditRequest(
    emailEditTokenRequest: EmailEditTokenRequest,
    user: User,
  ) {
    try {
      if (!user) {
        throw new UnauthorizedException('User not authorized');
      }
      const card = await this.cardModel.findById(emailEditTokenRequest._id);
      if (!card || card.deleted) {
        throw new NotFoundException('Card was not found');
      }
      const newEmailEditToken = await this.emailEditTokenModel.create({
        emailEditToken: nanoid(),
        card,
      });
      await newEmailEditToken.save();
      await this.mailSenderService.sendConfirmCardEmailEditMail(
        card.name,
        card.email,
        newEmailEditToken.emailEditToken,
      );
      return { message: 'Request has been sent' };
    } catch (e) {}
  }

  async approveEmailEdit(token: string) {
    try {
      const findCardByToken = await this.emailEditTokenModel.findOne({
        emailEditToken: token,
      });
      if (!findCardByToken) {
        throw new NotFoundException('Token not found');
      }
      if (findCardByToken.tokenUsed) {
        return {
          message: 'Token already used',
          status: false,
        };
      }
      const cardWithEmailToEdit = await this.cardModel.findById(
        findCardByToken.card,
      );
      await cardWithEmailToEdit.updateOne({
        emailEditable: true,
      });
      await cardWithEmailToEdit.save();
      const setTokenToUsed = await this.emailEditTokenModel.findOneAndUpdate(
        {
          emailEditToken: token,
        },
        { tokenUsed: true },
      );

      await setTokenToUsed.save();
      return {
        message: 'Email Edit Request Approved',
        status: true,
        card: cardWithEmailToEdit,
      };
    } catch (e) {
      throw new ConflictException('Error approving reqeust', e.message);
    }
  }

  async editEmail(emailEditRequest: EmailEditRequest, id: string, user: User) {
    try {
      if (!user) {
        throw new UnauthorizedException('User not authoizes');
      }
      const card = await this.cardModel.findById(id);
      if (card.emailEditable) {
        await card.updateOne({ email: emailEditRequest.email });
        await card.save();
        await this.mailSenderService.sendConfirmCardNewEmail(
          card.name,
          card.email,
        );
        return { message: 'card email successfully editted' };
      }
    } catch (e) {
      throw new ConflictException('Error editing card');
    }
  }

  async deleteCardRequest(
    deleteCardTokenRequest: DeleteCardTokenRequest,
    user: User,
  ) {
    try {
      if (!user) {
        throw new UnauthorizedException('Not Authorised');
      }
      const card = await this.cardModel.findById(deleteCardTokenRequest._id);
      if (!card || card.deleted) {
        throw new NotFoundException('Card was not found');
      }
      const newDeleteToken = await this.deleteTokenModel.create({
        deleteToken: nanoid(),
        card,
      });
      await newDeleteToken.save();
      await this.mailSenderService.sendConfirmCardDeletionMail(
        card.name,
        card.email,
        newDeleteToken.deleteToken,
      );
      return { message: 'Request has been sent' };
    } catch (e) {
      throw new ConflictException('Error sending request', e.message);
    }
  }

  async approveDeleteRequest(token: string) {
    try {
      const findCardByToken = await this.deleteTokenModel.findOne({
        deleteToken: token,
      });
      if (!findCardByToken) {
        throw new NotFoundException('Token not found');
      }
      if (findCardByToken.tokenUsed) {
        return {
          message: 'Token already used',
          status: false,
        };
      }
      const cardToDelete = await this.cardModel.findById(findCardByToken.card);
      await cardToDelete.updateOne({
        deleteable: true,
      });
      await cardToDelete.save();
      const setTokenToUsed = await this.deleteTokenModel.findOneAndUpdate(
        {
          deleteToken: token,
        },
        { tokenUsed: true },
      );

      await setTokenToUsed.save();
      return {
        message: 'Deletion Request Approved',
        status: true,
        card: cardToDelete,
      };
    } catch (e) {
      throw new ConflictException('Error approving reqeust', e.message);
    }
  }

  async deleteCard(id: string, user: User) {
    try {
      if (!user) {
        throw new UnauthorizedException('Not authorized for this action');
      }

      const cardToDelete = await this.cardModel.findById(id);
      if (
        cardToDelete.deleteable ||
        cardToDelete.createdAt >= addDays(moment().valueOf(), 356)
      ) {
        const increaseUserCardSlotCount =
          await this.userModel.findByIdAndUpdate(user._id, {
            availableCardSlots: user.availableCardSlots + 1,
          });
        await increaseUserCardSlotCount.save();
        await cardToDelete.delete();
        return { message: 'Card Deleted' };
      } else {
        const newDeleteToken = await this.deleteTokenModel.create({
          deleteToken: nanoid(),
          card: cardToDelete,
        });
        await newDeleteToken.save();
        await this.mailSenderService.sendConfirmCardDeletionMail(
          cardToDelete.name,
          cardToDelete.email,
          newDeleteToken.deleteToken,
        );
        return { message: 'Card Deletion Request Sent' };
      }
    } catch (e) {
      throw new ConflictException('Error deleting card', e.message);
    }
  }

  async getCardList(user: User) {
    const file = await this.createSpreadSheet(user);
    // console.log(file);
    const markerPhotoUpload = await this.s3_upload(
      file,
      this.AWS_S3_BUCKET,
      nanoid(8),
      'application/vnd.ms-excel',
    );
    const fileLink = markerPhotoUpload.Location;
    await this.mailSenderService.sendCardListEmail(
      user.firstName,
      user.email,
      fileLink,
    );
  }

  private async createSpreadSheet(user: User) {
    const cards = await this.cardModel.find({ user: user._id });
    if (cards.length <= 0) {
      return;
    }
    const cardsList = cards.map((card) => ({
      id: card.uniqueId,
      name: card.name,
      title: card.title,
      about: card.about,
      email: card.email,
      cardImage: card.cardImage,
      shortLink: `https://cards.beyin.me/${card.shortName}`,
      links: JSON.stringify(card.links),
      marker: card.marker.markerImageLink,
    }));
    const max_width = cardsList.reduce(
      (w, r) => Math.max(w, r.cardImage.length),
      10,
    );
    const worksheet = utils.json_to_sheet(cardsList);
    worksheet['!cols'] = [{ wch: max_width }];
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Cards');
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          'id',
          'name',
          'title',
          'about',
          'email',
          'cardImage',
          'shortLink',
          'links',
          'marker',
        ],
      ],
      {
        origin: 'A1',
      },
    );

    const cardListFile = write(workbook, { type: 'buffer' });
    return cardListFile;
  }
  //Private methods
  private async s3_upload(
    file: Buffer,
    bucket: string,
    name: string,
    mimetype: string,
  ) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response;
    } catch (e) {
      throw new ConflictException(e);
    }
  }

  private async checkUserCardCount(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User wasn't found");
    }
    if (user.availableCardSlots <= 0) {
      throw new ConflictException("User doesn't have enough card slots");
    }
    return true;
  }
}
