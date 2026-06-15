import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GeminiProvider.name);
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

    const contents = `${input.systemPrompt}\n\nConversation:\n${transcript}`;
    const maxAttempts = 2;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents
        });

        return {
          provider: this.name,
          model: this.model,
          text: response.text ?? ''
        };
      } catch (error) {
        lastError = error;
        const detail = this.extractErrorMessage(error);

        this.logger.warn(
          `Gemini request attempt ${attempt} of ${maxAttempts} failed: ${detail}`
        );

        if (attempt < maxAttempts) {
          await this.delay(500 * attempt);
        }
      }
    }

    throw new Error(
      `Gemini request failed after ${maxAttempts} attempts. ${this.extractErrorMessage(lastError)}`
    );
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      const causeMessage =
        error.cause instanceof Error
          ? error.cause.message
          : typeof error.cause === 'string'
            ? error.cause
            : '';

      return causeMessage ? `${error.message} (${causeMessage})` : error.message;
    }

    return 'Unknown Gemini SDK error';
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
