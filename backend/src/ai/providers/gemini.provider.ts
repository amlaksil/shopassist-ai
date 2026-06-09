import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import type {
  AiProvider,
  AiProviderInput,
  AiProviderResult
} from '../../common/interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ??
      this.configService.get<string>('GOOGLE_API_KEY');
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
  }

  async generateResponse(input: AiProviderInput): Promise<AiProviderResult> {
    if (!this.client) {
      throw new Error('Gemini provider is not configured');
    }

    const transcript = input.messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n');

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `${input.systemPrompt}\n\nConversation:\n${transcript}`
    });

    return {
      provider: this.name,
      model: this.model,
      text: response.text ?? ''
    };
  }
}
