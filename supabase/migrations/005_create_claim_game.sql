-- Create claim_game function (may not have been applied from migration 003)
-- Run this in Supabase SQL Editor if claim_game is missing

CREATE OR REPLACE FUNCTION public.claim_game(requested_game_id INTEGER)
RETURNS public.user_games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_pass public.user_passes;
  claimed_game public.user_games;
  game_title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO active_pass
  FROM public.user_passes
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND expires_at > now()
    AND games_claimed < games_allowed
  ORDER BY expires_at DESC
  LIMIT 1;

  IF active_pass.id IS NULL THEN
    RAISE EXCEPTION 'No active pass with remaining claims';
  END IF;

  SELECT title
  INTO game_title
  FROM public.games
  WHERE id = requested_game_id
    AND available = true;

  IF game_title IS NULL THEN
    RAISE EXCEPTION 'Game is not available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_games
    WHERE user_id = auth.uid()
      AND game_id = requested_game_id
  ) THEN
    RAISE EXCEPTION 'Game already claimed';
  END IF;

  INSERT INTO public.user_games (user_id, game_id, status)
  VALUES (auth.uid(), requested_game_id, 'doručené')
  RETURNING * INTO claimed_game;

  UPDATE public.user_passes
  SET games_claimed = games_claimed + 1
  WHERE id = active_pass.id;

  INSERT INTO public.transactions (user_id, type, item, amount, status)
  VALUES (
    auth.uid(),
    'Získanie',
    game_title,
    '-1 hra',
    'doručené'
  );

  RETURN claimed_game;
END;
$$;
