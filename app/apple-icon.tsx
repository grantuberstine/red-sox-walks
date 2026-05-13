import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #bd3039 0%, #8e1f26 100%)",
          color: "white",
          fontSize: 110,
          fontWeight: 900,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
          letterSpacing: -4,
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        WS
      </div>
    ),
    { ...size },
  );
}
