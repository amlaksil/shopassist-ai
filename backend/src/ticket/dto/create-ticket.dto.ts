import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { CreateTicketCustomerDto } from './create-ticket-customer.dto';
import { CreateTicketContextDto } from './create-ticket-context.dto';

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

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateTicketContextDto)
  ticket_context?: CreateTicketContextDto;
}
