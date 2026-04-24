import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BADGE_URL =
  "https://ih1.redbubble.net/image.4441310192.0640/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#305036",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={BADGE_URL}
          width={180}
          height={180}
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    { ...size }
  );
}
