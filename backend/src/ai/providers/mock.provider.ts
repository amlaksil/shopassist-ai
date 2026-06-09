import { Injectable } from '@nestjs/common';

import type {
  AiProvider,
  AiProviderInput,
  AiProviderResult
} from '../../common/interfaces/ai-provider.interface';

@Injectable()
export class MockProvider implements AiProvider {
  readonly name = 'mock';
  private readonly model = 'mock-support-model';

  async generateResponse(input: AiProviderInput): Promise<AiProviderResult> {
    const latestMessage = [...input.messages].reverse().find((message) => message.role === 'user');
    const userText = latestMessage?.content.toLowerCase() ?? '';

    let payload: Record<string, unknown> = {
      answer:
        'I can help with that. Based on the current policy, standard shipping takes 3 to 5 business days.',
      confidence: 'high',
      category: 'shipping',
      needs_ticket: false,
      follow_up_question: null
    };

    if (userText.includes('refund') || userText.includes('human') || userText.includes('complaint')) {
      payload = {
        answer:
          'This request should be reviewed by a human support specialist so the case can be handled properly.',
        confidence: 'medium',
        category: userText.includes('refund') ? 'refund' : 'complaint',
        needs_ticket: true,
        follow_up_question:
          'Please share your name, email, and a short issue summary so I can create a support ticket.'
      };
    } else if (userText.includes('product') || userText.includes('headphones')) {
      payload = {
        answer:
          'The Atlas Wireless Headphones include active noise cancellation, 32-hour battery life, and USB-C fast charging.',
        confidence: 'high',
        category: 'product',
        needs_ticket: false,
        follow_up_question: null
      };
    } else if (userText.includes('return')) {
      payload = {
        answer:
          'Eligible items can be returned within 30 days of delivery if they are in original condition.',
        confidence: 'high',
        category: 'returns',
        needs_ticket: false,
        follow_up_question: null
      };
    } else if (userText.includes('order') && userText.includes('where')) {
      payload = {
        answer:
          'I can help track an order, but I need either the order number or the email used at checkout.',
        confidence: 'medium',
        category: 'orders',
        needs_ticket: false,
        follow_up_question: 'Can you share your order number or checkout email?'
      };
    }

    return {
      provider: this.name,
      model: this.model,
      text: JSON.stringify(payload)
    };
  }
}
