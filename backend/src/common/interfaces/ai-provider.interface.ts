import type { MessageRole } from '../types/app.types';

export interface AiProviderMessage {
  role: MessageRole;
  content: string;
}

export interface AiProviderInput {
  systemPrompt: string;
  messages: AiProviderMessage[];
}

export interface AiProviderResult {
  provider: string;
  model: string;
  text: string;
}

export interface AiProvider {
  readonly name: string;
  generateResponse(input: AiProviderInput): Promise<AiProviderResult>;
}

