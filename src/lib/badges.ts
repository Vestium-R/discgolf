import { getHistory } from "./store";

export async function seasonBadgeMap(): Promise<Map<number, string | undefined>> {
  const hist = await getHistory();
  const m = new Map<number, string | undefined>();
  for (const h of hist) m.set(h.season, h.badgeImageUrl);
  return m;
}

export async function seasonBadge(season: number): Promise<string | undefined> {
  const map = await seasonBadgeMap();
  return map.get(season);
}
