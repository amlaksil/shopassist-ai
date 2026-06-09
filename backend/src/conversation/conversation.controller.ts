import { Controller, Get, Param } from '@nestjs/common';

import { ConversationService } from './conversation.service';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get('recent')
  async listRecentConversations() {
    return this.conversationService.listRecentConversations(12);
  }

  @Get(':sessionId/messages')
  async getConversationMessages(@Param('sessionId') sessionId: string) {
    return this.conversationService.getHistory(sessionId);
  }
}

