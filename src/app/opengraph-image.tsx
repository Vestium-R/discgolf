import { ImageResponse } from "next/og";

export const alt = "The Patch — disc golf standings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1f3323 0%, #305036 100%)",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            letterSpacing: -2,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              background:
                "radial-gradient(circle at 30% 30%, #ffe58c 0%, #e9b949 55%, #a67119 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2a1f05",
              fontSize: 90,
            }}
          >
            🧥
          </div>
          The Patch
        </div>
        <div style={{ fontSize: 32, opacity: 0.85, marginTop: 20 }}>
          The Traveling Patch · Always live
        </div>
      </div>
    ),
    { ...size }
  );
}
