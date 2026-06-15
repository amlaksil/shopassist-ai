import { BadRequestException } from '@nestjs/common';

import { TicketService } from '../src/ticket/ticket.service';

describe('TicketService', () => {
  const dataStoreService = {
    createSupportTicket: jest.fn(),
    getLatestProviderMetadata: jest.fn(),
    listOpenTickets: jest.fn(),
    updateSupportTicket: jest.fn(),
    recordAdminActivity: jest.fn()
  };
  const conversationService = {
    touchConversation: jest.fn(),
    recordMessage: jest.fn()
  };

  let service: TicketService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TicketService(dataStoreService as never, conversationService as never);
  });

  it('rejects form-based ticket creation when required fields are missing', async () => {
    await expect(
      service.createTicketFromForm({
        session_id: 'session_1',
        issue_category: 'refund',
        customer: {
          name: 'Jamie',
          email: '',
          issue_summary: 'Refund request'
        }
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a ticket and writes a conversation update from the form flow', async () => {
    dataStoreService.getLatestProviderMetadata.mockResolvedValue({
      provider: 'gemini',
      model: 'gemini-2.5-flash'
    });
    dataStoreService.createSupportTicket.mockResolvedValue({
      id: 'ticket_12345678',
      email: 'jamie@example.com'
    });
    conversationService.touchConversation.mockResolvedValue({});
    conversationService.recordMessage.mockResolvedValue({});

    const response = await service.createTicketFromForm({
      session_id: 'session_1',
      issue_category: 'refund',
      customer: {
        name: 'Jamie',
        email: 'jamie@example.com',
        issue_summary: 'Refund request'
      }
    });

    expect(response.status).toBe('ticket_created');
    expect(response.provider).toBe('gemini');
    expect(response.ticket_id).toBe('ticket_12345678');
    expect(conversationService.touchConversation).toHaveBeenCalledTimes(1);
    expect(conversationService.recordMessage).toHaveBeenCalledTimes(1);
  });

  it('updates a ticket status and assignee', async () => {
    dataStoreService.updateSupportTicket.mockResolvedValue({
      id: 'ticket_12345678',
      session_id: 'session_1',
      status: 'in_progress',
      assignee: 'Order desk',
      provider_used: 'gemini',
      name: 'Jamie',
      email: 'jamie@example.com',
      issue_category: 'shipping_delay'
    });
    dataStoreService.recordAdminActivity.mockResolvedValue({});
    conversationService.touchConversation.mockResolvedValue({});

    const response = await service.updateTicket({
      actor: {
        email: 'hana@shopassist.local',
        display_name: 'Hana Tesfaye'
      },
      id: 'ticket_12345678',
      status: 'in_progress',
      assignee: 'Order desk'
    });

    expect(response.status).toBe('in_progress');
    expect(response.assignee).toBe('Order desk');
    expect(dataStoreService.updateSupportTicket).toHaveBeenCalledWith({
      id: 'ticket_12345678',
      status: 'in_progress',
      assignee: 'Order desk'
    });
    expect(dataStoreService.recordAdminActivity).toHaveBeenCalledWith({
      actor: {
        email: 'hana@shopassist.local',
        display_name: 'Hana Tesfaye'
      },
      action: 'ticket_updated',
      target_type: 'support_ticket',
      target_id: 'ticket_12345678',
      details: {
        status: 'in_progress',
        assignee: 'Order desk',
        issue_category: 'shipping_delay',
        session_id: 'session_1'
      }
    });
    expect(conversationService.touchConversation).toHaveBeenCalledWith({
      session_id: 'session_1',
      status: 'in_progress',
      provider_used: 'gemini',
      customer_name: 'Jamie',
      customer_email: 'jamie@example.com',
      issue_category: 'shipping_delay'
    });
  });
});
