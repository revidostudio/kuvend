import { ImageResponse } from "next/og";

export const alt = "Kuvend — Fjala jote, në tryezë";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#fff",
        color: "#001b44",
        borderTop: "18px solid #d71920",
        fontFamily: "Georgia",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 42, fontWeight: 700 }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            border: "5px solid #001b44",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#d71920",
          }}
        >
          •
        </div>
        Kuvend
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            lineHeight: 1.05,
            fontWeight: 700,
          }}
        >
          <span>Fjala jote,</span>
          <span style={{ color: "#d71920" }}>në tryezë.</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#52647b" }}>
          Propozime dhe votim këshillues për Shqipërinë
        </div>
      </div>
      <div style={{ display: "flex", fontFamily: "Arial", fontSize: 20, color: "#52647b" }}>
        I pavarur dhe joqeveritar · kuvend.org
      </div>
    </div>,
    size,
  );
}
