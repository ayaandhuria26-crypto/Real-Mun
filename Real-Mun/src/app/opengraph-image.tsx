import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Real-MUN — Train for Model UN with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8f7f4",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#0a0e1a",
            marginBottom: 16,
          }}
        >
          Real-MUN
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#b8860b",
            marginBottom: 24,
          }}
        >
          Train for Model UN with AI
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#6b7280",
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          AI-graded position papers, 1-on-1 coaching, and full mock conferences. Free during launch.
        </div>
      </div>
    ),
    { ...size }
  );
}
