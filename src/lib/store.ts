import { Redis } from "@upstash/redis";
import type { Player, Round, SeasonHistory, Settings } from "./types";
import { slug } from "./slug";

const SEED_PLAYERS: Player[] = [
  { name: "Jeffrey Rijkse" },
  { name: "Joel Pinet" },
  { name: "John Cormier" },
  { name: "Kevin Belliveau", udiscHandle: "Theyellowdart" },
  { name: "Marc Durette" },
  { name: "Mathieu Jacob" },
  { name: "Matthew McKeigan" },
  { name: "Reginald Roth" },
  { name: "Scott Brohm" },
].map((p) => ({ id: slug(p.name), name: p.name, udiscHandle: p.udiscHandle, active: true }));

const SEED_HISTORY: SeasonHistory[] = [
  {
    season: 2025,
    championPlayerId: "jeffrey-rijkse",
    championName: "Jeffrey Rijkse",
    note: "No round-by-round stats recorded",
  },
];

const SEED_SETTINGS: Settings = {
  currentSeason: new Date().getFullYear(),
};

const KEYS = {
  roster: "disc:roster",
  rounds: "disc:rounds",
  history: "disc:history",
  settings: "disc:settings",
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

let redisClient: Redis | null = null;
function redis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

const memory: Record<string, unknown> = {};

async function readKey<T>(key: Key, fallback: T): Promise<T> {
  const r = redis();
  if (r) {
    const val = await r.get<T>(key);
    if (val == null) {
      await r.set(key, fallback);
      return fallback;
    }
    return val;
  }
  if (memory[key] == null) memory[key] = fallback;
  return memory[key] as T;
}

async function writeKey<T>(key: Key, value: T): Promise<void> {
  const r = redis();
  if (r) {
    await r.set(key, value);
    return;
  }
  memory[key] = value;
}

export async function getRoster(): Promise<Player[]> {
  return readKey<Player[]>(KEYS.roster, SEED_PLAYERS);
}

export async function saveRoster(roster: Player[]): Promise<void> {
  await writeKey(KEYS.roster, roster);
}

export async function getRounds(): Promise<Round[]> {
  return readKey<Round[]>(KEYS.rounds, []);
}

export async function saveRounds(rounds: Round[]): Promise<void> {
  await writeKey(KEYS.rounds, rounds);
}

export async function addRound(round: Round): Promise<void> {
  const rounds = await getRounds();
  rounds.push(round);
  await saveRounds(rounds);
}

export async function deleteRound(id: string): Promise<void> {
  const rounds = await getRounds();
  await saveRounds(rounds.filter((r) => r.id !== id));
}

export async function getHistory(): Promise<SeasonHistory[]> {
  return readKey<SeasonHistory[]>(KEYS.history, SEED_HISTORY);
}

export async function saveHistory(history: SeasonHistory[]): Promise<void> {
  await writeKey(KEYS.history, history);
}

export async function getSettings(): Promise<Settings> {
  return readKey<Settings>(KEYS.settings, SEED_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeKey(KEYS.settings, settings);
}

export function isUsingRedis(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
