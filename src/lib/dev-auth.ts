import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/hooks/useAuth";

export const DEV_BYPASS_KEY = "fhp_dev_bypass";

export const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@localhost",
  app_metadata: {
    role: "admin",
    dev_mode: true,
    unlimited_access: true,
  },
  user_metadata: {
    username: "bean_enjoyer",
    is_dev: true,
    badge: "Developer",
  },
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
} as User;

export interface DevProfile extends Profile {
  is_dev: boolean;
  badge: string;
  unlimited_access: boolean;
  admin_role: boolean;
}

export const DEV_PROFILE: DevProfile = {
  id: DEV_USER.id,
  username: "bean_enjoyer",
  created_at: "2024-01-01T00:00:00.000Z",
  is_dev: true,
  badge: "Developer",
  unlimited_access: true,
  admin_role: true,
};

export function isDevBypassActive(): boolean {
  return sessionStorage.getItem(DEV_BYPASS_KEY) === "1";
}
