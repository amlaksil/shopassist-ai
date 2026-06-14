import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['open', 'in_progress', 'waiting_on_customer', 'resolved'])
  status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  assignee?: string;
}
