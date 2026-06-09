import { Module } from '@nestjs/common';

import { ConversationModule } from '../conversation/conversation.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [SupabaseModule, ConversationModule],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService]
})
export class TicketModule {}
