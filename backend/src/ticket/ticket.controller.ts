import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';

import { AdminAuthGuard, type AuthenticatedAdminRequest } from '../auth/admin-auth.guard';
import { PublicRateLimitGuard } from '../rate-limit/public-rate-limit.guard';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('open')
  @UseGuards(AdminAuthGuard)
  async listOpenTickets() {
    return this.ticketService.listOpenTickets();
  }

  @Post()
  @UseGuards(PublicRateLimitGuard)
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
  @UseGuards(AdminAuthGuard)
  async updateTicket(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
    @Req() request: AuthenticatedAdminRequest
  ) {
    try {
      return await this.ticketService.updateTicket({
        actor: request.adminUser!,
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
