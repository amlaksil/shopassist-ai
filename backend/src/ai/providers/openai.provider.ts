import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type {
  AiProvider,
  AiProviderInput,
  AiProviderResult
} from '../../common/interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async generateResponse(input: AiProviderInput): Promise<AiProviderResult> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured');
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: input.systemPrompt },
        ...input.messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      ]
    });

    return {
      provider: this.name,
      model: this.model,
      text: completion.choices[0]?.message?.content ?? ''
    };
  }
}

