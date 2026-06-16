/* ==========================================================================
   KAVYAHUB - SUPABASE CLIENT CONFIGURATION
   Description: Initializes the connection between frontend and backend.
   Security Note: Ensure Row Level Security (RLS) is ENABLED on your Supabase
                  tables, as anon keys are visible on the client side.
   ========================================================================== */

// 1. Supabase Credentials
const SUPABASE_URL = "https://cvdzmnlqwgqmiemkbkeg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHptbmxxd2dxbWllbWtia2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTU2MjksImV4cCI6MjA5NjIzMTYyOX0.a10uDn8D24BNGhMW0i9vHRZxuhjzZIWUfcqYgOPCLLU";

// 2. Fail-Safe Verification
// Optimization: Prevents the script from throwing a fatal unhandled exception if CDN fails
if (typeof supabase === "undefined") {
  console.error("KavyaHub Error: Supabase SDK script (CDN) failed to load. Please check your HTML scripts.");
  alert("Connection error: Please refresh the page or check your internet connection.");
  throw new Error("Supabase library is not available.");
}

// 3. Extract and Initialize Client Instance
const { createClient } = supabase;

// Globally accessible client instance across all other feature JS files
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("KavyaHub Database: Connection Initialized.");