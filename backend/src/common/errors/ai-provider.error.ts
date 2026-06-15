export type AiProviderFailureCode =
  | 'configuration'
  | 'authentication'
  | 'rate_limit'
  | 'network'
  | 'unknown';

export class AiProviderError extends Error {
  readonly name = 'AiProviderError';

  constructor(
    public readonly provider: string,
    public readonly code: AiProviderFailureCode,
    message: string,
    cause?: unknown
  ) {
    super(message);

    if (cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: cause,
        enumerable: false,
        configurable: true
      });
    }
  }
}

export function normalizeAiProviderError(provider: string, error: unknown) {
  if (error instanceof AiProviderError) {
    return error;
  }

  const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    detail.includes('not configured') ||
    detail.includes('missing') ||
    detail.includes('required')
  ) {
    return new AiProviderError(
      provider,
      'configuration',
      'The assistant is not configured correctly.',
      error
    );
  }

  if (
    detail.includes('401') ||
    detail.includes('403') ||
    detail.includes('api key') ||
    detail.includes('unauthorized') ||
    detail.includes('forbidden') ||
    detail.includes('permission')
  ) {
    return new AiProviderError(
      provider,
      'authentication',
      'The assistant could not authenticate with the AI provider.',
      error
    );
  }

  if (
    detail.includes('429') ||
    detail.includes('quota') ||
    detail.includes('rate limit') ||
    detail.includes('resource exhausted')
  ) {
    return new AiProviderError(
      provider,
      'rate_limit',
      'The AI provider is temporarily rate limited.',
      error
    );
  }

  if (
    detail.includes('fetch failed') ||
    detail.includes('network') ||
    detail.includes('timed out') ||
    detail.includes('timeout') ||
    detail.includes('econn') ||
    detail.includes('enotfound') ||
    detail.includes('socket') ||
    detail.includes('dns')
  ) {
    return new AiProviderError(
      provider,
      'network',
      'The assistant could not reach the AI provider.',
      error
    );
  }

  return new AiProviderError(
    provider,
    'unknown',
    'The assistant could not complete the AI request.',
    error
  );
}
