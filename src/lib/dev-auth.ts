import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/hooks/useAuth";

export const DEV_BYPASS_KEY = "fhp_dev_bypass";

export const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@localhost",
  app_metadata: {},
  user_metadata: { username: "bean_enjoyer" },
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
} as User;

export const DEV_PROFILE: Profile = {
  id: DEV_USER.id,
  username: "bean_enjoyer",
  created_at: "2024-01-01T00:00:00.000Z",
};

export function isDevBypassActive(): boolean {
  return sessionStorage.getItem(DEV_BYPASS_KEY) === "1";
}
