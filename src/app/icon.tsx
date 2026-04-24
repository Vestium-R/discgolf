import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 30% 30%, #ffe58c 0%, #e9b949 55%, #a67119 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 360,
        }}
      >
        🧥
      </div>
    ),
    { ...size }
  );
}
