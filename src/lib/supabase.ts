import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylhvzlkiifkohhuemmuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHZ6bGtpaWZrb2hodWVtbXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzUxMjksImV4cCI6MjA4NzM1MTEyOX0.BsA1Vk_ooQxX-0nDfsPSMpvUIbgUxaXJUaxB0Zxfo9E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
