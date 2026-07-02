-- Fix: allow anonymous users to browse the game catalog.
-- Previously the SELECT policy was scoped TO authenticated only,
-- which meant dev-bypass users and unauthenticated visitors got an empty library.

DROP POLICY IF EXISTS "Authenticated users can view games" ON public.games;

CREATE POLICY "Anyone can view games" ON public.games
  FOR SELECT TO anon, authenticated
  USING (true);
