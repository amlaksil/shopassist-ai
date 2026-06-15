import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [ConfigModule],
  providers: [AdminAuthService, AdminAuthGuard],
  exports: [AdminAuthService, AdminAuthGuard]
})
export class AuthModule {}
