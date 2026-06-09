import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { KnowledgeBaseService } from './knowledge-base.service';

@Module({
  imports: [SupabaseModule],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService]
})
export class KnowledgeBaseModule {}

