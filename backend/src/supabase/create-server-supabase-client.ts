import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import WebSocket from 'ws';

export function createServerSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options: SupabaseClientOptions<'public'> = {}
): SupabaseClient {
  const transport = WebSocket as unknown as NonNullable<
    SupabaseClientOptions<'public'>['realtime']
  >['transport'];

  return createClient(supabaseUrl, supabaseKey, {
    ...options,
    realtime: {
      transport,
      ...(options.realtime ?? {})
    }
  });
}
