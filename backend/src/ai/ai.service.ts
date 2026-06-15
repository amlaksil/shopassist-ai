import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { normalizeAiProviderError } from '../common/errors/ai-provider.error';
import type { AiProviderInput, AiProviderResult } from '../common/interfaces/ai-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly mockProvider: MockProvider
  ) {}

  getConfiguredProvider() {
    return this.configService.get<string>('AI_PROVIDER', 'mock');
  }

  async generateResponse(input: AiProviderInput): Promise<AiProviderResult> {
    const provider = this.getConfiguredProvider();

    try {
      switch (provider) {
        case 'openai':
          return this.openAiProvider.generateResponse(input);
        case 'anthropic':
          return this.anthropicProvider.generateResponse(input);
        case 'gemini':
          return this.geminiProvider.generateResponse(input);
        default:
          return this.mockProvider.generateResponse(input);
      }
    } catch (error) {
      throw normalizeAiProviderError(provider, error);
    }
  }
}
