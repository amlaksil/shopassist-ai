import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ConversationService } from './conversation.service';

@Controller('conversations')
@UseGuards(AdminAuthGuard)
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
