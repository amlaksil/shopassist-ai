import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import type { AuthenticatedAdminRequest } from '../auth/admin-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { DataStoreService } from '../supabase/data-store.service';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly dataStoreService: DataStoreService) {}

  @Get('session')
  getSession(@Req() request: AuthenticatedAdminRequest) {
    return request.adminUser;
  }

  @Get('dashboard')
  async getDashboard() {
    return this.dataStoreService.getDashboardStats();
  }
}
