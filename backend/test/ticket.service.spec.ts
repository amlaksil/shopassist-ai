import { BadRequestException } from '@nestjs/common';

import { TicketService } from '../src/ticket/ticket.service';

describe('TicketService', () => {
  const dataStoreService = {
    createSupportTicket: jest.fn(),
    getLatestProviderMetadata: jest.fn(),
    listOpenTickets: jest.fn()
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
});
