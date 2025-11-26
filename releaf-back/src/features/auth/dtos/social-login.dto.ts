import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsUrl()
  @IsOptional()
  profileImageUrl?: string;
}
