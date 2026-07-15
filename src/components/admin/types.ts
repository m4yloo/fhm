export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
  admin_role: boolean;
}

export interface AdminPassRequest {
  id: string;
  user_id: string;
  pass_type: "limited" | "unlimited";
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
  profiles?: { username: string } | null;
}

export interface AdminGame {
  id: number;
  title: string;
  image: string | null;
  rating: string;
  genre: string;
  platform: string;
  year: number;
  tags: string[];
}

export interface AdminUserPass {
  id: string;
  user_id: string;
  pass_type: "limited" | "unlimited";
  status: string;
  games_allowed: number;
  games_claimed: number;
  expires_at: string;
  created_at: string;
}

export interface AdminUserGame {
  id: string;
  game_id: number;
  license_key: string;
  acquired_at: string;
  game: {
    title: string;
    platform: string;
    image: string | null;
  };
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  description: string;
  amount: number | null;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalGames: number;
  pendingRequests: number;
  activePasses: number;
  totalUserGames: number;
  totalTransactions: number;
  recentUsers: number;
}
