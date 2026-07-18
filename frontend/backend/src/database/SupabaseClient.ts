import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('[Supabase Backend Client] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in the environment variables. Using placeholders.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);


