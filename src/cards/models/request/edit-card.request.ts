import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class EditCardRequest {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name on card',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Vegetable Farmer',
    description: 'Title to be show on card',
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'lorem ipsum ',
    description: 'About section which would be displayed on the card',
  })
  @IsOptional()
  @IsString()
  about: string;

  @ApiProperty({
    example: 'beyin',
    description: "card's special name",
  })
  @IsString()
  @IsOptional()
  shortName: string;

  @ApiProperty({
    example: true,
    description: "card's active status",
  })
  @IsOptional()
  activeStatus: boolean;

  @ApiProperty({
    example: 'johndoe234@example.com',
    description: 'Email to be associated woith card',
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: {
      markerFileLink: '',
      markerImageLink: '',
    },
    description: "card's target image and marker links",
  })
  @IsOptional()
  marker: string;

  @IsOptional()
  @ApiProperty({
    description: 'base64 data uri',
  })
  cardImage: string;

  @IsOptional()
  @ApiProperty({
    description: 'base64 data uri',
  })
  logoImage: string;

  @IsOptional()
  @ApiProperty({
    description: 'Card logo image',
  })
  cardBackgroundImage: string;

  @ApiProperty({
    example: [
      {
        name: 'twitter',
        link: 'https://twitter.com/bitsbysalih',
      },
    ],
    description: 'links associated with card',
  })
  @IsOptional()
  links: string;
}
