import fs from 'fs';
import path from 'path';

// ────────────────────────────────────────────────────────────────────────────
// search-games.js
//
// Rebuilds src/data/games.ts so it contains ONLY games that appear on the
// FitGirl list (the "allowed" list). For every entry we try, in order, to
// avoid spending an IGDB credit:
//
//   1. Skip duplicate names within the FitGirl list itself (e.g. the same
//      title appearing once with DLC and once without).
//   2. Reuse the game object already present in games.ts if its title
//      matches the cleaned FitGirl name — no IGDB request at all.
//   3. Only otherwise hit the IGDB search API. A miss (nothing returned)
//      is logged to scripts/.search-skipped.json and dropped, per request:
//      "if you don't find a game from there on the igdb, skip".
//
// Resumability: scripts/.search-cache.json is the single source of truth.
// It holds the full in-progress result array plus a `processed` counter
// (number of FitGirl queue items already handled). An interrupted run
// continues exactly where it stopped and NEVER re-credits a search —
// even when IGDB returned a title different from the searched name.
// games.ts is regenerated from the cache on every checkpoint.
// ────────────────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const INPUT_FILE = process.argv[2] || 'C:/Users/crais/Desktop/abc/scraped_data/fitgirl_games_list.txt';
const OUTPUT_FILE = path.resolve(process.cwd(), 'src/data/games.ts');
const CACHE_FILE = path.resolve(process.cwd(), 'scripts/.search-cache.json');
const SKIPPED_FILE = path.resolve(process.cwd(), 'scripts/.search-skipped.json');
const BATCH_SIZE = 4;               // parallel requests per batch
const BATCH_DELAY_MS = 1050;        // wait between batches (~3.8 req/s, under IGDB's 4/s)

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET env vars.');
  process.exit(1);
}

// Strip version numbers, DLC lists, repack notes, build IDs, etc.
// "A Plague Tale: Requiem – v1.0.0.0 Steam/GOG + Protector Pack DLC"
//   -> "A Plague Tale: Requiem"
function cleanName(raw) {
  let s = raw.trim();
  // Cut at separator dash that precedes version/repack info.
  s = s.split(/\s+[\u2013\u2014-]\s+/)[0];
  // Remove trailing version patterns
  s = s.replace(/\s+[vV]\d[\w.-]*.*$/, '');
  s = s.replace(/\s+[bB]uild[\w\s.]*.*$/, '');
  // Remove "+ X DLCs", "+ All DLCs", "+ Bonus" tails
  s = s.replace(/\s*\+.*$/, '');
  // Trim trailing punctuation/whitespace
  s = s.replace(/[\s,;:|]+$/, '').trim();
  return s;
}

// Within JSON string literals, replace invalid escape sequences "\X" (where X
// is not a valid JSON escape char) with just "X". Valid escapes are left as-is.
// Backslashes outside strings are untouched. Used to repair games.ts entries
// whose summaries contained stray backslashes from the source data.
function sanitizeBackslashesInStrings(text) {
  const valid = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);
  let out = '';
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
      continue;
    }
    // inside a string
    if (ch === '\\') {
      const nxt = text[i + 1];
      if (nxt === undefined) { out += '\\'; continue; }
      if (valid.has(nxt)) {
        out += '\\' + nxt;
        i += 1;
      } else {
        out += nxt;     // drop the stray backslash, keep the following char
        i += 1;
      }
      continue;
    }
    out += ch;
    if (ch === '"') inStr = false;
  }
  return out;
}

// Re-quote bare TS object keys (id:, title:, ...) to turn a MOCK_GAMES array
// literal into valid JSON. Crucially, this walks char-by-char and only quotes
// identifiers before ':' while OUTSIDE a string literal — a naive regex would
// corrupt string values that contain ", word:" patterns inside descriptions.
function requoteKeys(text) {
  let out = '';
  let i = 0;
  let inStr = false;
  const ident = /[A-Za-z_$][A-Za-z0-9_$]*/;
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      out += ch;
      if (ch === '\\') { out += text[i + 1] || ''; i += 2; continue; }
      if (ch === '"') inStr = false;
      i++;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; i++; continue; }
    const m = ident.exec(text.slice(i));
    if (m) {
      const rest = text.slice(i + m[0].length);
      if (/^\s*:/.test(rest)) {
        out += '"' + m[0] + '":';
        i += m[0].length + rest.match(/^\s*:/)[0].length;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

// Load the games array currently written to games.ts, as plain objects.
function loadExistingGames() {
  try {
    const src = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const match = src.match(/MOCK_GAMES[^=]*=\s*\[([\s\S]*)\];\s*$/);
    if (!match) return [];
    let body = match[1].trim();
    if (body.endsWith(',')) body = body.slice(0, -1);
    body = requoteKeys(body);
    // Some IGDB summaries written by the older fetch-games.js contain stray
    // backslashes (e.g. "\D", "\A") that are not valid JSON escapes. Walk the
    // text outside string literals is not enough — they live INSIDE strings —
    // so we only fix backslashes inside string values.
    body = sanitizeBackslashesInStrings(body);
    return JSON.parse('[' + body + ']');
  } catch (e) {
    console.warn('loadExistingGames: could not parse games.ts:', e.message);
    return [];
  }
}

let token = null;
async function getToken() {
  if (token) return token;
  const url = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`OAuth failed: ${await res.text()}`);
  token = (await res.json()).access_token;
  return token;
}

// Search IGDB for a game by name (PC platform = 6)
async function searchGame(name, t) {
  const query =
    'fields name, summary, storyline, rating, rating_count, first_release_date, ' +
    'cover.url, genres.name, platforms.name, ' +
    'involved_companies.company.name, involved_companies.developer, involved_companies.publisher;\n' +
    'search "' + name.replace(/"/g, '\\"') + '";\n' +
    'where platforms = (6);\n' +
    'limit 1;';
  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${t}`,
      'Content-Type': 'text/plain',
    },
    body: query,
  });
  if (res.status === 429) {
    await sleep(2000);
    return searchGame(name, t);
  }
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

function formatGame(g) {
  let imageUrl = '/images/game1.png';
  if (g.cover && g.cover.url) {
    imageUrl = g.cover.url.startsWith('http') ? g.cover.url : `https:${g.cover.url}`;
    imageUrl = imageUrl.replace('t_thumb', 't_720p');
  }
  const genresList = (g.genres && g.genres.map(gen => gen.name)) || ['Akčná'];
  const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 2023;
  let developer = 'Neznámy vývojár';
  let publisher = 'Neznámy vydavateľ';
  if (g.involved_companies) {
    const devCo = g.involved_companies.find(c => c.developer);
    if (devCo) developer = devCo.company.name;
    const pubCo = g.involved_companies.find(c => c.publisher);
    if (pubCo) publisher = pubCo.company.name;
  }
  const description = g.summary
    ? (g.summary.slice(0, 150) + (g.summary.length > 150 ? '...' : ''))
    : `${g.name} je titul z kategórie ${genresList[0]}.`;
  const longDescription = g.storyline || g.summary || 'K tejto hre nie je k dispozícii žiadny príbeh.';
  const sizeOptions = ['15 GB', '30 GB', '50 GB', '75 GB', '90 GB'];
  const size = sizeOptions[Math.abs(g.id) % sizeOptions.length];
  const miniGameOptions = ['balatro', 'outerwilds', 'sekiro', 'hades'];
  return {
    id: g.id,
    title: g.name,
    platform: 'Steam',
    available: true,
    image: imageUrl,
    genre: genresList[0],
    year,
    description,
    longDescription,
    features: [
      'Kompletne pohlcujúci zážitok z hry',
      'Vynikajúce vizuálne spracovanie a soundtrack',
      'Detailne navrhnutý herný svet',
      'Vysoké hodnotenia kritikov a hráčov'
    ],
    developer,
    publisher,
    rating: g.rating ? `${Math.round(g.rating)}%` : '90%',
    size,
    tags: [...genresList.slice(0, 3), 'Steam'],
    sysRequirementsMin: {
      os: 'Windows 10 64-bit',
      cpu: 'Intel Core i5-6600K / AMD Ryzen 5 1600',
      ram: '8 GB RAM',
      gpu: 'NVIDIA GeForce GTX 1060 3GB / AMD Radeon RX 580',
      storage: `${size} voľného miesta`
    },
    sysRequirementsRec: {
      os: 'Windows 10/11 64-bit',
      cpu: 'Intel Core i7-8700K / AMD Ryzen 7 2700X',
      ram: '16 GB RAM',
      gpu: 'NVIDIA GeForce RTX 2060 / AMD Radeon RX 5700 XT',
      storage: `${size} (SSD odporúčané)`
    },
    miniGameId: miniGameOptions[Math.abs(g.id) % miniGameOptions.length]
  };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Source of truth between runs: { games, skipped, processed }
function loadCache() {
  try {
    const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    return {
      games: Array.isArray(c.games) ? c.games : [],
      skipped: Array.isArray(c.skipped) ? c.skipped : [],
      processed: Number(c.processed) || 0
    };
  } catch {
    return { games: [], skipped: [], processed: 0 };
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    games: cache.games,
    skipped: cache.skipped,
    processed: cache.processed
  }));
}

function loadSkippedStandalone() {
  try { return JSON.parse(fs.readFileSync(SKIPPED_FILE, 'utf-8')); }
  catch { return []; }
}

function writeSkipped(skipped) {
  fs.writeFileSync(SKIPPED_FILE, JSON.stringify(skipped, null, 2));
}

function writeGamesFile(games) {
  const fileContent =
    'export interface Game {\n' +
    '  id: number;\n  title: string;\n  platform: string;\n  available: boolean;\n' +
    '  image: string;\n  genre: string;\n  year: number;\n  description: string;\n' +
    '  longDescription: string;\n  features: string[];\n  developer: string;\n' +
    '  publisher: string;\n  rating: string;\n  size: string;\n  tags: string[];\n' +
    '  sysRequirementsMin: Record<string, string>;\n' +
    '  sysRequirementsRec: Record<string, string>;\n' +
    '  miniGameId: "balatro" | "outerwilds" | "sekiro" | "hades";\n}\n\n' +
    'export const MOCK_GAMES: Game[] = ' + JSON.stringify(games, null, 2) + ';\n';
  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
}

async function main() {
  const rawLines = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // 1) De-duplicate within the FitGirl list itself (same cleaned name twice
  //    -> handled once), preserving order of first appearance.
  const seenNames = new Set();
  const queue = [];
  for (const raw of rawLines) {
    const name = cleanName(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    queue.push(name);
  }

  // 2) Reuse existing games.ts entries whose title matches a FitGirl name.
  //    Indexed by lowercased title for O(1) lookup — no IGDB credit spent.
  const existing = loadExistingGames();
  const existingByTitle = new Map();
  for (const g of existing) {
    if (g && typeof g.title === 'string' && !existingByTitle.has(g.title.toLowerCase())) {
      existingByTitle.set(g.title.toLowerCase(), g);
    }
  }

  // Resume from cache (single source of truth — lossless across runs).
  const cache = loadCache();
  const skipped = cache.skipped.length ? cache.skipped : loadSkippedStandalone();
  const resultTitles = new Set(cache.games.map(g => String(g.title).toLowerCase()));
  let reused = 0, apiHits = 0, apiMisses = 0;

  const startIdx = Math.min(cache.processed, queue.length);
  console.log(`\n[FHP] Fronta: ${queue.length} unikatnych mien (z ${rawLines.length} riadkov)`);
  console.log(`      Existujucich v games.ts na znovupouzitie: ${existingByTitle.size}`);
  console.log(`      Pokracujem od riadku ${startIdx} (${cache.games.length} uz v cache)\n`);

  let t = await getToken();
  let processedThisRun = 0;

  // Process the queue in batches of BATCH_SIZE concurrent requests.
  for (let i = startIdx; i < queue.length; ) {
    const batchNames = [];
    const batchIdxs = [];
    for (let b = 0; b < BATCH_SIZE && i + b < queue.length; b++) {
      batchNames.push(queue[i + b]);
      batchIdxs.push(i + b);
    }

    const results = await Promise.all(
      batchNames.map(async (name, b) => {
        const idx = batchIdxs[b];
        const canReuse = existingByTitle.has(name.toLowerCase());

        // a) Reuse from existing games.ts (free).
        let game = canReuse ? existingByTitle.get(name.toLowerCase()) : null;
        if (game && resultTitles.has(String(game.title).toLowerCase())) game = null;

        // b) Otherwise query IGDB (costs a credit).
        if (!game) {
          try {
            game = await searchGame(name, t);
          } catch (e) {
            if (String(e.message).includes('401') || String(e.message).includes('OAuth')) {
              try { t = await getToken(); game = await searchGame(name, t); } catch { game = null; }
            } else {
              game = null;
            }
          }
          return { idx, name, game, canReuse, hit: true };
        }

        return { idx, name, game, canReuse, hit: false };
      })
    );

    // Process results in order to keep cache deterministic.
    for (const { idx, name, game, canReuse, hit } of results) {
      if (game && !resultTitles.has(String(game.title).toLowerCase())) {
        const entry = canReuse ? game : formatGame(game);
        cache.games.push(entry);
        resultTitles.add(String(entry.title).toLowerCase());
        if (hit) apiHits++;
        else reused++;
      } else if (!game) {
        apiMisses++;
        if (!skipped.includes(name)) skipped.push(name);
      }

      cache.processed = idx + 1;
      processedThisRun++;
    }

    i += batchNames.length;

    process.stdout.write(
      `\rOK ${batchNames[batchNames.length - 1].slice(0, 45).padEnd(45)} | ${String(cache.games.length).padStart(4)} hier | ` +
      `${i}/${queue.length} | IGDB ${apiHits} | reuse ${reused} | batch ${Math.ceil(i / BATCH_SIZE)}   `
    );

    // Checkpoint every 25 items.
    if (processedThisRun % 25 < batchNames.length) {
      saveCache(cache);
      writeSkipped(skipped);
    }

    // Throttle: only sleep if any IGDB call was made this batch.
    const hadApiHit = results.some(r => r.hit);
    if (hadApiHit) await sleep(BATCH_DELAY_MS);
  }

  saveCache(cache);
  writeSkipped(skipped);

  // Everything in the cache is already in final Game shape (IGDB hits are
  // formatted at insertion; reused objects were already formatted).
  writeGamesFile(cache.games);

  console.log(`\n\nHotovo!`);
  console.log(`  Vo vysledku:    ${cache.games.length} hier`);
  console.log(`  Znovupouzite z games.ts (zadarmo): ${reused}`);
  console.log(`  IGDB requestov: ${apiHits}`);
  console.log(`  Preskocenych (nenasli sa na IGDB): ${apiMisses}`);
  console.log(`  Zapisane do:    ${OUTPUT_FILE}\n`);
}

main().catch(e => {
  console.error('\nChyba:', e.message);
  process.exit(1);
});
