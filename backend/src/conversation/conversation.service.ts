import { Injectable } from '@nestjs/common';

import type {
  ConversationRecord,
  ConversationStatus,
  StoredMessage
} from '../common/types/app.types';
import { DataStoreService } from '../supabase/data-store.service';

@Injectable()
export class ConversationService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  async touchConversation(input: {
    session_id: string;
    status: ConversationStatus;
    provider_used: string;
    latest_message?: string;
    customer_name?: string | null;
    customer_email?: string | null;
    issue_category?: string | null;
  }): Promise<ConversationRecord> {
    return this.dataStoreService.ensureConversation(input);
  }

  async recordMessage(input: {
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    provider_used?: string | null;
    model_used?: string | null;
    status: ConversationStatus;
  }): Promise<StoredMessage> {
    return this.dataStoreService.appendMessage(input);
  }

  async getHistory(sessionId: string): Promise<StoredMessage[]> {
    return this.dataStoreService.getConversationMessages(sessionId);
  }

  async listRecentConversations(limit = 10): Promise<ConversationRecord[]> {
    return this.dataStoreService.listRecentConversations(limit);
  }
}

