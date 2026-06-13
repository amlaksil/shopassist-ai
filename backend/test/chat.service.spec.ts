import { ChatService } from '../src/chat/chat.service';
import { AiProviderError } from '../src/common/errors/ai-provider.error';

describe('ChatService', () => {
  const aiService = {
    generateResponse: jest.fn()
  };
  const knowledgeBaseService = {
    findRelevantContext: jest.fn()
  };
  const conversationService = {
    touchConversation: jest.fn(),
    recordMessage: jest.fn(),
    getHistory: jest.fn()
  };
  const ticketService = {
    getMissingCustomerFields: jest.fn(),
    createTicket: jest.fn()
  };

  let service: ChatService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ChatService(
      aiService as never,
      knowledgeBaseService as never,
      conversationService as never,
      ticketService as never
    );

    knowledgeBaseService.findRelevantContext.mockResolvedValue({
      faqs: [],
      products: [],
      summary: 'Returns are accepted within 30 days.'
    });
    conversationService.touchConversation.mockResolvedValue({});
    conversationService.recordMessage.mockResolvedValue({});
    conversationService.getHistory.mockResolvedValue([
      {
        role: 'user',
        content: 'I want a refund'
      }
    ]);
  });

  it('asks for customer details before creating a ticket', async () => {
    aiService.generateResponse.mockResolvedValue({
      provider: 'mock',
      model: 'mock-support-model',
      text: JSON.stringify({
        answer: 'I can create a ticket for that.',
        confidence: 'medium',
        category: 'refund',
        needs_ticket: true,
        follow_up_question: 'Please share your name, email, and issue summary.'
      })
    });
    ticketService.getMissingCustomerFields.mockReturnValue(['name', 'email', 'issue_summary']);

    const response = await service.handleChat({
      message: 'I want a refund from a human agent',
      session_id: 'session_1'
    });

    expect(response.status).toBe('ticket_required');
    expect(response.requires_customer_details).toBe(true);
    expect(response.missing_customer_fields).toEqual(['name', 'email', 'issue_summary']);
    expect(ticketService.createTicket).not.toHaveBeenCalled();
  });

  it('creates a ticket when customer details are complete', async () => {
    aiService.generateResponse.mockResolvedValue({
      provider: 'mock',
      model: 'mock-support-model',
      text: JSON.stringify({
        answer: 'Escalating this now.',
        confidence: 'medium',
        category: 'refund',
        needs_ticket: true,
        follow_up_question: null
      })
    });
    ticketService.getMissingCustomerFields.mockReturnValue([]);
    ticketService.createTicket.mockResolvedValue({
      id: 'ticket_12345678',
      email: 'jamie@example.com'
    });

    const response = await service.handleChat({
      message: 'I need refund help from a human',
      session_id: 'session_1',
      customer: {
        name: 'Jamie',
        email: 'jamie@example.com',
        issue_summary: 'Refund request for damaged item'
      }
    });

    expect(response.status).toBe('ticket_created');
    expect(response.ticket_id).toBe('ticket_12345678');
    expect(ticketService.createTicket).toHaveBeenCalledTimes(1);
  });

  it('falls back to ticket collection when the provider is unavailable', async () => {
    aiService.generateResponse.mockRejectedValue(
      new AiProviderError(
        'gemini',
        'network',
        'The assistant could not reach the AI provider.'
      )
    );
    ticketService.getMissingCustomerFields.mockReturnValue(['name', 'email', 'issue_summary']);

    const response = await service.handleChat({
      message: 'Can you help with my refund?',
      session_id: 'session_2'
    });

    expect(response.status).toBe('ticket_required');
    expect(response.provider).toBe('gemini');
    expect(response.model).toBe('unavailable');
    expect(response.requires_customer_details).toBe(true);
    expect(response.answer).toContain('support team');
  });

  it('creates a ticket when the provider is unavailable but customer details are already present', async () => {
    aiService.generateResponse.mockRejectedValue(
      new AiProviderError(
        'gemini',
        'authentication',
        'The assistant could not authenticate with the AI provider.'
      )
    );
    ticketService.getMissingCustomerFields.mockReturnValue([]);
    ticketService.createTicket.mockResolvedValue({
      id: 'ticket_87654321',
      email: 'jamie@example.com'
    });

    const response = await service.handleChat({
      message: 'Please help with a refund',
      session_id: 'session_3',
      customer: {
        name: 'Jamie',
        email: 'jamie@example.com',
        issue_summary: 'Refund request for damaged item'
      }
    });

    expect(response.status).toBe('ticket_created');
    expect(response.provider).toBe('gemini');
    expect(response.model).toBe('unavailable');
    expect(response.ticket_id).toBe('ticket_87654321');
    expect(ticketService.createTicket).toHaveBeenCalledTimes(1);
  });
});
