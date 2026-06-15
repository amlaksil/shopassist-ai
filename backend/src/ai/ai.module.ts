import { Module } from '@nestjs/common';

import { GeminiProvider } from './providers/gemini.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MockProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AiService } from './ai.service';

@Module({
  providers: [AiService, OpenAiProvider, AnthropicProvider, GeminiProvider, MockProvider],
  exports: [AiService]
})
export class AiModule {}
