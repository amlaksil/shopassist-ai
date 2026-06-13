import { HttpException, HttpStatus } from '@nestjs/common';

import { PublicRateLimitGuard } from '../src/rate-limit/public-rate-limit.guard';

describe('PublicRateLimitGuard', () => {
  it('allows requests under the limit', () => {
    const guard = new PublicRateLimitGuard();
    const context = createContext('10.0.0.1');

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks requests after the limit is reached', () => {
    const guard = new PublicRateLimitGuard();
    const context = createContext('10.0.0.2');

    for (let count = 0; count < 30; count += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    try {
      guard.canActivate(context);
      throw new Error('Expected rate limit exception');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});

function createContext(ip: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        ip,
        socket: {
          remoteAddress: ip
        }
      })
    })
  } as never;
}
