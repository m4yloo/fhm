// Mock database fallback — returns empty data when Supabase is unreachable.
// Supabase is the primary data source; these are only used as safety nets.

let supabaseFailed = false;
try {
  supabaseFailed = sessionStorage.getItem("fhp_supabase_failed") === "1";
} catch (e) {}

export function markSupabaseFailed() {
  if (!supabaseFailed) {
    console.warn("Supabase connection issue detected.");
    supabaseFailed = true;
    try {
      sessionStorage.setItem("fhp_supabase_failed", "1");
    } catch (e) {}
  }
}

export function isSupabaseHealthy() {
  return !supabaseFailed;
}

export function getMockGames(): any[] {
  return [];
}

export function getMockGame(_id: number): null {
  return null;
}

export function getMockUserGames(_userId: string): any[] {
  return [];
}

export function getMockPasses(_userId: string): any[] {
  return null;
}

export function getMockTransactions(_userId: string): any[] {
  return [];
}

export function getMockPassRequests(_userId: string): any[] {
  return [];
}

export function mockRequestPass(_userId: string, _passType: string): any {
  return { id: "mock", user_id: _userId, pass_type: _passType, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export function mockCancelPassRequest(_userId: string, _id: string): void {}

export function mockClaimGame(_userId: string, _gameId: number): any {
  return { id: "mock", user_id: _userId, game_id: _gameId };
}
