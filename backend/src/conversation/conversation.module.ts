import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService]
})
export class ConversationModule {}

