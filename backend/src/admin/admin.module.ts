import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [AdminController]
})
export class AdminModule {}

