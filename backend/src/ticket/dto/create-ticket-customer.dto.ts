import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateTicketCustomerDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(300)
  issue_summary!: string;
}

