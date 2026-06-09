import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  issue_summary?: string;
}

