import { ImageResponse } from "next/og";

export const alt = "VANTAGE: home SOC lab and alert triage console";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0b0d",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path
              d="M5 6.5 C5 5.7 5.7 5 6.5 5 H25.5 C26.3 5 27 5.7 27 6.5 V16 C27 22.5 22.2 26.3 16 28 C9.8 26.3 5 22.5 5 16 Z"
              fill="none"
              stroke="#5b8cff"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.4"
            />
            <path
              d="M10 11 L16 20.5 L22 11"
              fill="none"
              stroke="#5b8cff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="13.3" r="1.9" fill="#5b8cff" />
          </svg>
          <span style={{ color: "#e7e8ea", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            VANTAGE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ color: "#e7e8ea", fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
            Home SOC lab and alert triage console
          </span>
          <span style={{ color: "#9ca1aa", fontSize: 30, maxWidth: 900 }}>
            Wazuh · Sysmon · Atomic Red Team · custom detections · Claude-assisted triage
          </span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {["Real detections", "Human verdicts", "Honest coverage"].map((t) => (
            <span
              key={t}
              style={{
                color: "#9ca1aa",
                fontSize: 24,
                border: "1px solid #26282e",
                borderRadius: 8,
                padding: "8px 16px",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
