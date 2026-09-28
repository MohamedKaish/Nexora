import type { NextConfig } from "next";

const DEFAULT_SUPABASE_URL = "https://rruavarqxdotdsbbjvck.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydWF2YXJxeGRvdGRzYmJqdmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzM5MjQsImV4cCI6MjEwMTE0OTkyNH0.3SLbaEOaOWxnSqgiSXvLNwiSt6OJPdAzVQMyk2wmpKA";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("sb_publishable_")
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : DEFAULT_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
