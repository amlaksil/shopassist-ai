import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConversationModule } from '../conversation/conversation.module';
import { PublicRateLimitGuard } from '../rate-limit/public-rate-limit.guard';
import { SupabaseModule } from '../supabase/supabase.module';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [SupabaseModule, ConversationModule, AuthModule],
  controllers: [TicketController],
  providers: [TicketService, PublicRateLimitGuard],
  exports: [TicketService]
})
export class TicketModule {}
