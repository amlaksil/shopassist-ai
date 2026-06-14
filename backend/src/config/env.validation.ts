const allowedProviders = ['mock', 'openai', 'anthropic', 'gemini'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const provider = String(config.AI_PROVIDER ?? 'mock');

  if (!allowedProviders.includes(provider as (typeof allowedProviders)[number])) {
    throw new Error(`AI_PROVIDER must be one of: ${allowedProviders.join(', ')}`);
  }

  if (provider === 'openai' && !config.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
  }

  if (provider === 'anthropic' && !config.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
  }

  if (provider === 'gemini' && !config.GEMINI_API_KEY && !config.GOOGLE_API_KEY) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required when AI_PROVIDER=gemini');
  }

  return {
    ...config,
    AI_PROVIDER: provider,
    PORT: Number(config.PORT ?? 3000),
    CORS_ORIGIN: String(config.CORS_ORIGIN ?? '')
  };
}
