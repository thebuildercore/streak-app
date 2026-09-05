import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables!");
}

// We use the Service Role key so the backend can bypass Row Level Security (RLS)
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);