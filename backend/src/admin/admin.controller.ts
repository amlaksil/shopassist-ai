import { Controller, Get } from '@nestjs/common';

import { DataStoreService } from '../supabase/data-store.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly dataStoreService: DataStoreService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.dataStoreService.getDashboardStats();
  }
}

