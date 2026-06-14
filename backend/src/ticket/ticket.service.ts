import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  ConversationStatus,
  CustomerInfo,
  SupportTicket,
  SupportTicketRequest,
  SupportTicketResponsePayload
} from '../common/types/app.types';
import { ConversationService } from '../conversation/conversation.service';
import { DataStoreService } from '../supabase/data-store.service';

@Injectable()
export class TicketService {
  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly conversationService: ConversationService
  ) {}

  getMissingCustomerFields(
    customer?: CustomerInfo,
    suggestedCustomer?: Partial<CustomerInfo>
  ): Array<keyof CustomerInfo> {
    const fields: Array<keyof CustomerInfo> = ['name', 'email', 'issue_summary'];

    return fields.filter((field) => {
      const value = customer?.[field] ?? suggestedCustomer?.[field];
      return !value || !value.trim();
    });
  }

  async createTicket(
    input: SupportTicketRequest & {
      provider_used: string;
      model_used: string;
    }
  ): Promise<SupportTicket> {
    return this.dataStoreService.createSupportTicket({
      session_id: input.session_id,
      name: input.customer.name,
      email: input.customer.email,
      issue_summary: input.customer.issue_summary,
      issue_category: input.issue_category,
      ticket_context: input.ticket_context,
      provider_used: input.provider_used,
      model_used: input.model_used
    });
  }

  async listOpenTickets() {
    return this.dataStoreService.listOpenTickets(15);
  }

  async updateTicket(input: {
    id: string;
    status?: SupportTicket['status'];
    assignee?: string;
  }) {
    if (!input.status && input.assignee === undefined) {
      throw new BadRequestException('Nothing to update');
    }

    const ticket = await this.dataStoreService.updateSupportTicket({
      id: input.id,
      status: input.status,
      assignee: input.assignee
    });

    await this.conversationService.touchConversation({
      session_id: ticket.session_id,
      status: mapTicketStatusToConversationStatus(ticket.status),
      provider_used: ticket.provider_used ?? 'system',
      customer_name: ticket.name,
      customer_email: ticket.email,
      issue_category: ticket.issue_category
    });

    return ticket;
  }

  async createTicketFromForm(input: {
    session_id: string;
    customer: CustomerInfo;
    issue_category: string;
    ticket_context?: SupportTicketRequest['ticket_context'];
  }): Promise<SupportTicketResponsePayload> {
    const missingCustomerFields = this.getMissingCustomerFields(input.customer);

    if (missingCustomerFields.length > 0) {
      throw new BadRequestException(
        `Missing customer fields: ${missingCustomerFields.join(', ')}`
      );
    }

    const metadata = await this.dataStoreService.getLatestProviderMetadata(input.session_id);
    const ticket = await this.createTicket({
      session_id: input.session_id,
      customer: input.customer as Required<CustomerInfo>,
      issue_category: input.issue_category,
      ticket_context: input.ticket_context,
      provider_used: metadata.provider,
      model_used: metadata.model
    });

    const answer = `Your request has been escalated. Ticket ${ticket.id.slice(
      0,
      8
    )} is now open, and our support team will follow up at ${ticket.email}.`;

    await this.conversationService.touchConversation({
      session_id: input.session_id,
      status: 'open',
      provider_used: metadata.provider,
      latest_message: answer,
      customer_name: input.customer.name ?? null,
      customer_email: input.customer.email ?? null,
      issue_category: input.issue_category
    });

    await this.conversationService.recordMessage({
      session_id: input.session_id,
      role: 'assistant',
      content: answer,
      provider_used: metadata.provider,
      model_used: metadata.model,
      status: 'ticket_created'
    });

    return {
      session_id: input.session_id,
      answer,
      status: 'ticket_created',
      category: input.issue_category,
      confidence: 'high',
      provider: metadata.provider,
      model: metadata.model,
      ticket_id: ticket.id
    };
  }
}

function mapTicketStatusToConversationStatus(
  status: SupportTicket['status']
): ConversationStatus {
  switch (status) {
    case 'open':
      return 'open';
    case 'in_progress':
      return 'in_progress';
    case 'waiting_on_customer':
      return 'waiting_on_customer';
    case 'resolved':
      return 'resolved';
    default:
      return 'ticket_created';
  }
}
