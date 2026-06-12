import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class OrderLookupDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  order_number?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;
}
