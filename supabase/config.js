const SUPABASE_URL = "https://cvdzmnlqwgqmiemkbkeg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHptbmxxd2dxbWllbWtia2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTU2MjksImV4cCI6MjA5NjIzMTYyOX0.a10uDn8D24BNGhMW0i9vHRZxuhjzZIWUfcqYgOPCLLU";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);