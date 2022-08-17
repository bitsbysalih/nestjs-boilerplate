import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
export class CreateCardRequest {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name on card',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Vegetable Farmer',
    description: 'Title to be show on card',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'lorem ipsum ',
    description: 'About section which would be displayed on the card',
  })
  @IsNotEmpty()
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
  //   @IsNotEmpty()
  @IsOptional()
  activeStatus: boolean;

  @ApiProperty({
    example: 'johndoe234@example.com',
    description: 'Email to be associated woith card',
  })
  @IsNotEmpty()
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
  marker: any;

  @IsOptional()
  @ApiProperty({
    description: 'Card profile photo',
  })
  cardImage: string;

  @IsOptional()
  @ApiProperty({
    description: 'Card logo image',
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
  links: any;
}
