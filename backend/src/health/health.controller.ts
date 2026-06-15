import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DataStoreService } from '../supabase/data-store.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataStoreService: DataStoreService
  ) {}

  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai_provider: this.configService.get<string>('AI_PROVIDER', 'mock'),
      persistence_mode: this.dataStoreService.getStorageMode(),
      supabase: await this.dataStoreService.getHealthStatus()
    };
  }
}
