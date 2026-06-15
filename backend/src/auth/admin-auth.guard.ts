import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import type { AdminSessionUser } from '../common/types/app.types';

import { AdminAuthService } from './admin-auth.service';

export interface AuthenticatedAdminRequest {
  headers: {
    authorization?: string;
  };
  adminUser?: AdminSessionUser;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedAdminRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Please sign in to access the support workspace.');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('Please sign in to access the support workspace.');
    }

    request.adminUser = await this.adminAuthService.validateAdminAccessToken(token);
    return true;
  }
}
