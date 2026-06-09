import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { validateEnv } from './config/env.validation';
import { ConversationModule } from './conversation/conversation.module';
import { HealthModule } from './health/health.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    SupabaseModule,
    AiModule,
    KnowledgeBaseModule,
    ConversationModule,
    TicketModule,
    ChatModule,
    HealthModule,
    AdminModule
  ]
})
export class AppModule {}

