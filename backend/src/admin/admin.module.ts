import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AdminController]
})
export class AdminModule {}
