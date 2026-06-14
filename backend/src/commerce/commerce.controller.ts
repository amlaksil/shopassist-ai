import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { OrderService } from './order.service';
import { OrderLookupDto } from './dto/order-lookup.dto';

@Controller('orders')
export class CommerceController {
  constructor(private readonly orderService: OrderService) {}

  @Post('lookup')
  async lookupOrder(@Body() body: OrderLookupDto) {
    if (!body.order_number && !body.email) {
      throw new BadRequestException('Order number or email is required');
    }

    return this.orderService.lookupOrderSummary({
      orderNumber: body.order_number,
      email: body.email
    });
  }
}
