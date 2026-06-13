import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post
} from '@nestjs/common';

import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

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

  @Patch(':id')
  async updateTicket(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    try {
      return await this.ticketService.updateTicket({
        id,
        status: body.status,
        assignee: body.assignee
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unable to update support ticket'
      );
    }
  }
}
