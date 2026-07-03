import { ImageResponse } from "next/og";
import { getHistory, getPatchTransfers, getRoster, getRounds } from "@/lib/store";
import { badgeTimeline } from "@/lib/scoring";

export const alt = "Traveling Patch round summary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [roster, rounds, history, transfers] = await Promise.all([getRoster(), getRounds(), getHistory(), getPatchTransfers()]);
  const round = rounds.find((r) => r.id === id);
  if (!round) {
    return new ImageResponse(<Fallback title="Round not found" subtitle="" />, size);
  }
  const byId = new Map(roster.map((p) => [p.id, p]));
  const winner = [...round.results].sort((a, b) => a.position - b.position)[0];
  const winnerName = (winner && byId.get(winner.playerId)?.name) ?? "Unknown";

  const seasonRec = history.find((h) => h.season === round.season);
  const events = badgeTimeline(rounds, round.season, seasonRec?.initialBadgeHolderPlayerId ?? null, transfers);
  const thisEvent = events.find((e) => e.round.id === round.id);
  const prevHolder = thisEvent?.prevHolderId ? byId.get(thisEvent.prevHolderId) : null;
  const holderAfter = thisEvent ? byId.get(thisEvent.holderId) : null;
  const headline = thisEvent
    ? thisEvent.kind === "stolen"
      ? `🗡 ${holderAfter?.name ?? "?"} stole the patch`
      : thisEvent.kind === "defended"
        ? `🛡 ${holderAfter?.name ?? "?"} defended the patch`
        : thisEvent.kind === "no-change"
          ? `💤 ${prevHolder?.name ?? "?"} kept the patch — ${winnerName} won the round`
          : `🥏 ${holderAfter?.name ?? "?"} took the patch`
    : `${winnerName} won the round`;
  const subtitle = `${round.date}${round.courseName ? ` · ${round.courseName}` : ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "80px",
          background: "linear-gradient(135deg, #2c4a32 0%, #3d6642 100%)",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.8, letterSpacing: 4, textTransform: "uppercase" }}>
          The Traveling Patch
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, marginTop: 40, lineHeight: 1.1 }}>
          {headline}
        </div>
        <div style={{ fontSize: 36, opacity: 0.85, marginTop: 32 }}>{subtitle}</div>
        <div style={{ marginTop: "auto", display: "flex", fontSize: 28, opacity: 0.75 }}>
          Season {round.season} · {winnerName} took #1
        </div>
      </div>
    ),
    size,
  );
}

function Fallback({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#2c4a32",
        color: "white",
        padding: 80,
        fontFamily: "system-ui",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 32, opacity: 0.8, marginTop: 20 }}>{subtitle}</div>
    </div>
  );
}
