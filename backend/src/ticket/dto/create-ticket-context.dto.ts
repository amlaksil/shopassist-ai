import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTicketContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  order_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  checkout_email?: string;

  @IsOptional()
  @IsIn([
    'label_created',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'delayed',
    'exception',
    'not_shipped'
  ])
  shipment_status?:
    | 'label_created'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'delayed'
    | 'exception'
    | 'not_shipped';

  @IsOptional()
  @IsString()
  @MaxLength(240)
  escalation_reason?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  timeline_summary?: string;
}
