import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  return envVars;
}

const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load games data from TypeScript file (read as text and parse)
const gamesTsPath = join(__dirname, '..', 'src', 'data', 'games.ts');
const gamesTsContent = readFileSync(gamesTsPath, 'utf-8');

// Extract the MOCK_GAMES array from the TypeScript file
const gamesMatch = gamesTsContent.match(/export const MOCK_GAMES: Game\[\] = (\[[\s\S]*\]);/);
if (!gamesMatch) {
  console.error('Error: Could not extract MOCK_GAMES from games.ts');
  process.exit(1);
}

// Parse the array (using eval since we trust our own data)
const MOCK_GAMES = eval(gamesMatch[1]);

async function seedGames() {
  console.log(`Starting to seed ${MOCK_GAMES.length} games...`);

  // Transform mock data to match Supabase schema
  const gamesToInsert = MOCK_GAMES.map(game => ({
    id: game.id,
    title: game.title,
    platform: game.platform,
    available: game.available,
    image: game.image,
    genre: game.genre,
    year: game.year,
    description: game.description,
    long_description: game.longDescription,
    features: game.features,
    developer: game.developer,
    publisher: game.publisher,
    rating: game.rating,
    size: game.size,
    tags: game.tags,
    sys_requirements_min: game.sysRequirementsMin,
    sys_requirements_rec: game.sysRequirementsRec,
  }));

  // Insert in batches of 100 to avoid hitting limits
  const batchSize = 100;
  for (let i = 0; i < gamesToInsert.length; i += batchSize) {
    const batch = gamesToInsert.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gamesToInsert.length / batchSize)} (${batch.length} games)...`);
    
    const { error } = await supabase
      .from('games')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      process.exit(1);
    }
  }

  console.log('✅ Successfully seeded games table!');
}

seedGames().catch(console.error);
