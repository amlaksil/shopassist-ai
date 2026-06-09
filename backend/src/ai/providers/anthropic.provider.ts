import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import type {
  AiProvider,
  AiProviderInput,
  AiProviderResult
} from '../../common/interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    this.model = this.configService.get<string>(
      'ANTHROPIC_MODEL',
      'claude-3-5-sonnet-20240620'
    );
  }

  async generateResponse(input: AiProviderInput): Promise<AiProviderResult> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured');
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 700,
      system: input.systemPrompt,
      messages: input.messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    });

    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      provider: this.name,
      model: this.model,
      text: textContent
    };
  }
}

