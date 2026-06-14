import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { CustomerInfoDto } from './customer-info.dto';

export class ChatRequestDto {
  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsString()
  @MaxLength(120)
  session_id!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer?: CustomerInfoDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  order_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  checkout_email?: string;
}
