import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { CommerceModule } from '../commerce/commerce.module';
import { ConversationModule } from '../conversation/conversation.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { TicketModule } from '../ticket/ticket.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AiModule, CommerceModule, KnowledgeBaseModule, ConversationModule, TicketModule],
  controllers: [ChatController],
  providers: [ChatService]
})
export class ChatModule {}
