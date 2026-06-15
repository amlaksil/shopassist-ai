import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common';

interface RateLimitRequest {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers: {
    'x-forwarded-for'?: string | string[];
  };
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private static readonly buckets = new Map<string, RateLimitBucket>();
  private static readonly windowMs = 5 * 60 * 1000;
  private static readonly maxRequests = 30;

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const key = this.buildKey(request);
    const now = Date.now();
    const existing = PublicRateLimitGuard.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      PublicRateLimitGuard.buckets.set(key, {
        count: 1,
        resetAt: now + PublicRateLimitGuard.windowMs
      });
      return true;
    }

    if (existing.count >= PublicRateLimitGuard.maxRequests) {
      throw new HttpException(
        'Too many requests from this connection. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    existing.count += 1;
    PublicRateLimitGuard.buckets.set(key, existing);
    return true;
  }

  private buildKey(request: RateLimitRequest) {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const clientIp =
      forwardedValue?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown';

    return `public:${clientIp}`;
  }
}
