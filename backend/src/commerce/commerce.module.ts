import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { CommerceController } from './commerce.controller';
import { OrderService } from './order.service';

@Module({
  imports: [SupabaseModule],
  controllers: [CommerceController],
  providers: [OrderService],
  exports: [OrderService]
})
export class CommerceModule {}
