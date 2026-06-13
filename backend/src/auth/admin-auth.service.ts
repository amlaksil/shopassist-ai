import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminSessionUser } from '../common/types/app.types';

interface SupportAdminRecord {
  email: string;
  display_name: string;
  is_active: boolean;
}

@Injectable()
export class AdminAuthService {
  private readonly supabase: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase =
      supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
          })
        : null;
  }

  async validateAdminAccessToken(token: string): Promise<AdminSessionUser> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Admin authentication requires Supabase to be configured.'
      );
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Your admin session is no longer valid.');
    }

    const email = data.user.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('A verified admin email is required.');
    }

    const { data: adminRecord, error: adminError } = await this.supabase
      .from('support_admin_emails')
      .select('email, display_name, is_active')
      .eq('email', email)
      .maybeSingle();

    if (adminError) {
      throw new InternalServerErrorException(
        `Unable to verify admin access: ${adminError.message}`
      );
    }

    const admin = adminRecord as SupportAdminRecord | null;

    if (!admin || !admin.is_active) {
      throw new ForbiddenException('This account is not approved for the support workspace.');
    }

    return {
      email: admin.email,
      display_name: admin.display_name
    };
  }
}
