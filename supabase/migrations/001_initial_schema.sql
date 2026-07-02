-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Games table
CREATE TABLE public.games (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  available BOOLEAN DEFAULT true NOT NULL,
  image TEXT NOT NULL,
  genre TEXT NOT NULL,
  year INTEGER NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb NOT NULL,
  developer TEXT NOT NULL,
  publisher TEXT NOT NULL,
  rating TEXT NOT NULL,
  size TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb NOT NULL,
  sys_requirements_min JSONB DEFAULT '{}'::jsonb NOT NULL,
  sys_requirements_rec JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User passes/subscriptions
CREATE TABLE public.user_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('limited', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  games_allowed INTEGER NOT NULL,
  games_claimed INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, status)
);

-- User games (claimed games)
CREATE TABLE public.user_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  pass_id UUID NOT NULL REFERENCES public.user_passes(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'redeemed', 'revoked')),
  UNIQUE(user_id, game_id)
);

-- Transactions/ledger for audit trail
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES public.games(id) ON DELETE SET NULL,
  pass_id UUID REFERENCES public.user_passes(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('pass_purchase', 'game_claim', 'pass_renewal', 'pass_upgrade')),
  amount NUMERIC(10, 2),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_games_genre ON public.games(genre);
CREATE INDEX idx_games_year ON public.games(year);
CREATE INDEX idx_games_available ON public.games(available);
CREATE INDEX idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX idx_user_games_game_id ON public.user_games(game_id);
CREATE INDEX idx_user_passes_user_id ON public.user_passes(user_id);
CREATE INDEX idx_user_passes_status ON public.user_passes(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read their own profile, public read for username lookup
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Games: Public read access (authenticated users)
CREATE POLICY "Authenticated users can view games" ON public.games
  FOR SELECT TO authenticated
  USING (true);

-- User passes: Users can read/update their own passes
CREATE POLICY "Users can view own passes" ON public.user_passes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own passes" ON public.user_passes
  FOR UPDATE USING (auth.uid() = user_id);

-- User games: Users can read their own games
CREATE POLICY "Users can view own games" ON public.user_games
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can read their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_passes_updated_at BEFORE UPDATE ON public.user_passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
