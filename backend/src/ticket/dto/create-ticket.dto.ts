import { Type } from 'class-transformer';
import { IsObject, IsString, MaxLength, ValidateNested } from 'class-validator';

import { CreateTicketCustomerDto } from './create-ticket-customer.dto';

export class CreateTicketDto {
  @IsString()
  @MaxLength(120)
  session_id!: string;

  @IsString()
  @MaxLength(60)
  issue_category!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateTicketCustomerDto)
  customer!: CreateTicketCustomerDto;
}
