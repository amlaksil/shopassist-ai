import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post
} from '@nestjs/common';

import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('open')
  async listOpenTickets() {
    return this.ticketService.listOpenTickets();
  }

  @Post()
  async createTicket(@Body() body: CreateTicketDto) {
    try {
      return await this.ticketService.createTicketFromForm(body);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unable to create support ticket'
      );
    }
  }
}
