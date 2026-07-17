import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GlobalConfig } from '../config/GlobalConfig';

const config = GlobalConfig.getInstance().getSupabaseConfig();

// Create a single, real Supabase client instance
export const supabaseClient = createClient(config.url, config.key);

// Export the type for use in repositories
export type { SupabaseClient };
