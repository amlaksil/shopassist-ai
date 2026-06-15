import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { PublicRateLimitGuard } from '../rate-limit/public-rate-limit.guard';

import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(PublicRateLimitGuard)
  async createChatResponse(@Body() body: ChatRequestDto) {
    return this.chatService.handleChat(body);
  }
}
