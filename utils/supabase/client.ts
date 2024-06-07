"use client";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ckverkgafbwocawjhiji.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmVya2dhZmJ3b2Nhd2poaWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU4NjAwNiwiZXhwIjoyMDMzMTYyMDA2fQ.MU55MDWw4YJTv-1PFTTyfPnj9sr_WX7JvWkZz_5AoIQ"
);
