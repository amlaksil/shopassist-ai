import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { AiService } from '../ai/ai.service';
import { OrderService } from '../commerce/order.service';
import {
  AiProviderError,
  type AiProviderFailureCode
} from '../common/errors/ai-provider.error';
import type { AiProviderMessage } from '../common/interfaces/ai-provider.interface';
import type {
  ChatResponsePayload,
  ConfidenceLevel,
  CustomerInfo,
  KnowledgeContext
} from '../common/types/app.types';
import { extractJsonObject } from '../common/utils/json';
import { ConversationService } from '../conversation/conversation.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { TicketService } from '../ticket/ticket.service';
import { ChatRequestDto } from './dto/chat-request.dto';

interface ParsedAiPayload {
  answer: string;
  confidence: ConfidenceLevel;
  category: string;
  needs_ticket: boolean;
  follow_up_question?: string | null;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly orderService: OrderService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly conversationService: ConversationService,
    private readonly ticketService: TicketService
  ) {}

  async handleChat(request: ChatRequestDto): Promise<ChatResponsePayload> {
    const normalizedMessage = request.message.trim();
    const customer = this.normalizeCustomer(request.customer);
    const escalationIntent = this.detectEscalationIntent(normalizedMessage);

    await this.conversationService.touchConversation({
      session_id: request.session_id,
      status: 'answered',
      provider_used: 'system',
      latest_message: normalizedMessage,
      customer_name: customer.name ?? null,
      customer_email: customer.email ?? null
    });

    await this.conversationService.recordMessage({
      session_id: request.session_id,
      role: 'user',
      content: normalizedMessage,
      provider_used: 'system',
      status: 'answered'
    });

    try {
      const orderTrackingResponse = await this.orderService.handleTrackingIntent({
        message: normalizedMessage,
        session_id: request.session_id,
        customer,
        order_number: request.order_number,
        checkout_email: request.checkout_email
      });

      if (orderTrackingResponse) {
        await this.persistAssistantResponse(orderTrackingResponse, customer);
        return orderTrackingResponse;
      }

      const [context, history] = await Promise.all([
        this.knowledgeBaseService.findRelevantContext(normalizedMessage),
        this.conversationService.getHistory(request.session_id)
      ]);

      const providerResponse = await this.aiService.generateResponse({
        systemPrompt: this.buildSystemPrompt(context, escalationIntent),
        messages: history
          .slice(-8)
          .map<AiProviderMessage>((message) => ({
            role: message.role,
            content: message.content
          }))
      });

      const aiPayload = this.parseAiPayload(providerResponse.text, normalizedMessage, context);
      const issueCategory = this.resolveCategory(normalizedMessage, aiPayload.category);
      const shouldEscalate = escalationIntent || aiPayload.needs_ticket;

      let response: ChatResponsePayload;

      if (shouldEscalate) {
        const missingCustomerFields = this.ticketService.getMissingCustomerFields(customer);

        if (missingCustomerFields.length > 0) {
          response = {
            session_id: request.session_id,
            answer:
              aiPayload.follow_up_question ??
              `I can hand this to a human support teammate. Please share your ${missingCustomerFields.join(
                ', '
              )}.`,
            status: 'ticket_required',
            category: issueCategory,
            confidence: 'medium',
            provider: providerResponse.provider,
            model: providerResponse.model,
            requires_customer_details: true,
            missing_customer_fields: missingCustomerFields
          };
        } else {
          const ticket = await this.ticketService.createTicket({
            session_id: request.session_id,
            customer: customer as Required<CustomerInfo>,
            issue_category: issueCategory,
            provider_used: providerResponse.provider,
            model_used: providerResponse.model
          });

          response = {
            session_id: request.session_id,
            answer: `Your request has been escalated. Ticket ${ticket.id.slice(
              0,
              8
            )} is now open, and our support team will follow up at ${ticket.email}.`,
            status: 'ticket_created',
            category: issueCategory,
            confidence: 'high',
            provider: providerResponse.provider,
            model: providerResponse.model,
            ticket_id: ticket.id
          };
        }
      } else {
        response = {
          session_id: request.session_id,
          answer: aiPayload.follow_up_question
            ? `${aiPayload.answer}\n\n${aiPayload.follow_up_question}`
            : aiPayload.answer,
          status: aiPayload.confidence === 'low' ? 'clarification_needed' : 'answered',
          category: issueCategory,
          confidence: aiPayload.confidence,
          provider: providerResponse.provider,
          model: providerResponse.model
        };
      }

      await this.persistAssistantResponse(response, customer);

      return response;
    } catch (error) {
      if (error instanceof AiProviderError) {
        this.logger.warn(
          `AI provider issue (${error.provider}/${error.code}): ${error.message}`
        );

        return this.handleProviderFailure({
          sessionId: request.session_id,
          customer,
          message: normalizedMessage,
          providerError: error
        });
      }

      this.logger.error('Unable to process chat request', error instanceof Error ? error.stack : '');

      await this.conversationService.touchConversation({
        session_id: request.session_id,
        status: 'error',
        provider_used: 'system',
        latest_message: 'Unable to process chat request'
      });

      await this.conversationService.recordMessage({
        session_id: request.session_id,
        role: 'assistant',
        content:
          'I ran into a temporary issue while processing that request. Please try again or ask for human support.',
        provider_used: 'system',
        status: 'error'
      });

      throw new InternalServerErrorException('Unable to process chat request');
    }
  }

  private async handleProviderFailure(input: {
    sessionId: string;
    customer: CustomerInfo;
    message: string;
    providerError: AiProviderError;
  }): Promise<ChatResponsePayload> {
    const issueCategory = this.resolveCategory(input.message, 'general');
    const missingCustomerFields = this.ticketService.getMissingCustomerFields(input.customer);

    if (missingCustomerFields.length === 0) {
      const ticket = await this.ticketService.createTicket({
        session_id: input.sessionId,
        customer: input.customer as Required<CustomerInfo>,
        issue_category: issueCategory,
        provider_used: input.providerError.provider,
        model_used: 'unavailable'
      });

      const answer =
        'I am having trouble connecting right now, so I have opened a support request for you. ' +
        `Ticket ${ticket.id.slice(0, 8)} is now open, and our support team will follow up at ${ticket.email}.`;

      const response: ChatResponsePayload = {
        session_id: input.sessionId,
        answer,
        status: 'ticket_created',
        category: issueCategory,
        confidence: 'low',
        provider: input.providerError.provider,
        model: 'unavailable',
        ticket_id: ticket.id
      };

      await this.persistAssistantResponse(response, input.customer);

      return response;
    }

    const response: ChatResponsePayload = {
      session_id: input.sessionId,
      answer: this.buildProviderFailureAnswer(input.providerError.code, missingCustomerFields),
      status: 'ticket_required',
      category: issueCategory,
      confidence: 'low',
      provider: input.providerError.provider,
      model: 'unavailable',
      requires_customer_details: true,
      missing_customer_fields: missingCustomerFields
    };

    await this.persistAssistantResponse(response, input.customer);

    return response;
  }

  private async persistAssistantResponse(
    response: ChatResponsePayload,
    customer: CustomerInfo
  ) {
    await this.conversationService.touchConversation({
      session_id: response.session_id,
      status: response.status,
      provider_used: response.provider,
      latest_message: response.answer,
      customer_name: customer.name ?? null,
      customer_email: customer.email ?? null,
      issue_category: response.category
    });

    await this.conversationService.recordMessage({
      session_id: response.session_id,
      role: 'assistant',
      content: response.answer,
      provider_used: response.provider,
      model_used: response.model,
      status: response.status
    });
  }

  private buildProviderFailureAnswer(
    code: AiProviderFailureCode,
    missingCustomerFields: Array<keyof CustomerInfo>
  ) {
    const missingFieldsText = missingCustomerFields.join(', ');

    if (code === 'authentication' || code === 'configuration') {
      return (
        'I am unable to access the assistant right now. ' +
        `If you would like, I can still open a support request for you. Please share your ${missingFieldsText}.`
      );
    }

    return (
      'I am having trouble connecting right now. ' +
      `I can still hand this to our support team. Please share your ${missingFieldsText}.`
    );
  }

  private buildSystemPrompt(context: KnowledgeContext, escalationIntent: boolean) {
    return `
You are ShopAssist AI, a concise, helpful customer support assistant for an e-commerce store.
Answer using only the provided context when possible.
If the answer is uncertain, ask a clarifying question instead of inventing facts.
If the customer asks for a human, a refund review, complaint handling, or anything clearly requiring manual action, set needs_ticket to true.
Return valid JSON only with this shape:
{
  "answer": "string",
  "confidence": "high|medium|low",
  "category": "shipping|returns|refund|payments|account|orders|product|complaint|general",
  "needs_ticket": true|false,
  "follow_up_question": "string or null"
}
Escalation signal already detected: ${escalationIntent ? 'yes' : 'no'}.
Relevant context:
${context.summary || 'No matching knowledge base entries were found.'}
`.trim();
  }

  private parseAiPayload(
    rawText: string,
    originalMessage: string,
    context: KnowledgeContext
  ): ParsedAiPayload {
    const parsed = extractJsonObject(rawText);

    if (!parsed) {
      return this.buildFallbackPayload(originalMessage, context);
    }

    return {
      answer:
        typeof parsed.answer === 'string' && parsed.answer.trim()
          ? parsed.answer
          : this.buildFallbackPayload(originalMessage, context).answer,
      confidence: this.coerceConfidence(parsed.confidence),
      category:
        typeof parsed.category === 'string' && parsed.category.trim()
          ? parsed.category
          : this.resolveCategory(originalMessage, 'general'),
      needs_ticket: Boolean(parsed.needs_ticket),
      follow_up_question:
        typeof parsed.follow_up_question === 'string' ? parsed.follow_up_question : null
    };
  }

  private buildFallbackPayload(message: string, context: KnowledgeContext): ParsedAiPayload {
    const category = this.resolveCategory(message, 'general');
    const topFaq = context.faqs[0];
    const topProduct = context.products[0];

    if (topFaq) {
      return {
        answer: `${topFaq.answer}`,
        confidence: 'medium',
        category,
        needs_ticket: false,
        follow_up_question: null
      };
    }

    if (topProduct) {
      return {
        answer: `${topProduct.name} is currently ${topProduct.inventory_status}. It is priced at ${topProduct.currency} ${topProduct.price}. ${topProduct.description}`,
        confidence: 'medium',
        category,
        needs_ticket: false,
        follow_up_question: null
      };
    }

    return {
      answer:
        'I can help, but I need a little more detail to give a precise answer. Can you share the order issue, product name, or policy question?',
      confidence: 'low',
      category,
      needs_ticket: false,
      follow_up_question: 'What specific order, product, or policy are you asking about?'
    };
  }

  private normalizeCustomer(customer?: ChatRequestDto['customer']): CustomerInfo {
    return {
      name: customer?.name?.trim(),
      email: customer?.email?.trim(),
      issue_summary: customer?.issue_summary?.trim()
    };
  }

  private detectEscalationIntent(message: string) {
    const normalized = message.toLowerCase();
    return [
      'human',
      'agent',
      'representative',
      'refund',
      'chargeback',
      'complaint',
      'manager',
      'angry'
    ].some((keyword) => normalized.includes(keyword));
  }

  private resolveCategory(message: string, fallback: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes('ship') || normalized.includes('delivery')) return 'shipping';
    if (normalized.includes('return')) return 'returns';
    if (normalized.includes('refund')) return 'refund';
    if (normalized.includes('payment') || normalized.includes('card')) return 'payments';
    if (normalized.includes('password') || normalized.includes('account')) return 'account';
    if (normalized.includes('order')) return 'orders';
    if (normalized.includes('product') || normalized.includes('sku')) return 'product';
    if (normalized.includes('complaint')) return 'complaint';

    return fallback;
  }

  private coerceConfidence(value: unknown): ConfidenceLevel {
    if (value === 'high' || value === 'medium' || value === 'low') {
      return value;
    }

    return 'medium';
  }
}
