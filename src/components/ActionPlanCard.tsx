import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import vamosSrc from "@/assets/vamos_logo_SQUARE.png";

interface ActionPlan {
  role: string;
  keepExploring: string[];
  startBuilding: string[];
  // Legacy fields for backward compatibility
  steps?: string[];
  experience?: string;
  careersPrompt: string;
}

interface ActionPlanCardProps {
  plan: ActionPlan;
  isFirst?: boolean;
  connectedClusters?: string[];
  onExploreMore?: () => void;
}

const ActionPlanCard = ({ plan, isFirst = true, connectedClusters = [], onExploreMore }: ActionPlanCardProps) => {
  const [downloading, setDownloading] = useState(false);

  const formatClusterList = (names: string[]) => {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  };

  // Normalize: support both new two-section format and legacy flat format
  const keepExploring = plan.keepExploring ?? [];
  const startBuilding = plan.startBuilding ?? [];
  const isLegacy = keepExploring.length === 0 && startBuilding.length === 0;
  const legacySteps = plan.steps ?? [];

  const generatePDF = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const w = 800;
      const h = 1400;
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);

      // Load logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = reject;
        logo.src = vamosSrc;
      });

      const logoH = 60;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, (w - logoW) / 2, 36, logoW, logoH);

      ctx.fillStyle = "#53D88B";
      ctx.font = "600 16px 'Secular One', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pathfinder", w / 2, 36 + logoH + 20);

      let y = 36 + logoH + 40;
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(w - 60, y);
      ctx.stroke();

      y += 30;

      ctx.fillStyle = "#53D88B";
      ctx.font = "600 26px 'Secular One', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Your Next Moves", w / 2, y);
      y += 40;

      ctx.fillStyle = "#666";
      ctx.font = "14px 'Roboto', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TARGET DIRECTION", w / 2, y);
      y += 28;

      ctx.fillStyle = "#222";
      ctx.font = "bold 20px 'Roboto', sans-serif";
      const roleLines = wrapText(ctx, plan.role, w - 120);
      for (const line of roleLines) {
        ctx.fillText(line, w / 2, y);
        y += 28;
      }
      y += 20;

      const drawSection = (title: string, items: string[], startY: number, accentColor = "#53D88B") => {
        let sy = startY;
        ctx.textAlign = "left";
        ctx.fillStyle = accentColor;
        ctx.font = "600 18px 'Secular One', sans-serif";
        ctx.fillText(title, 60, sy);
        sy += 8;

        for (let i = 0; i < items.length; i++) {
          sy += 28;
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(76, sy - 5, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 13px 'Roboto', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(i + 1), 76, sy - 1);

          ctx.textAlign = "left";
          ctx.fillStyle = "#333";
          ctx.font = "15px 'Roboto', sans-serif";
          const stepLines = wrapText(ctx, items[i], w - 160, "left");
          for (const line of stepLines) {
            ctx.fillText(line, 100, sy);
            sy += 22;
          }
          sy += 4;
        }
        return sy;
      };

      if (isLegacy) {
        y = drawSection("Next Steps", legacySteps, y);
      } else {
        y = drawSection("Keep Exploring", keepExploring, y);
        y += 20;

        // Start Building section with intro line
        ctx.textAlign = "left";
        ctx.fillStyle = "#F5C423";
        ctx.font = "600 18px 'Secular One', sans-serif";
        ctx.fillText("Start Building", 60, y);
        y += 22;
        ctx.fillStyle = "#999";
        ctx.font = "italic 12px 'Roboto', sans-serif";
        const introLines = wrapText(ctx, "These experiences build skills that PMs, consultants, and policy professionals all need — so even if your direction shifts, none of this is wasted.", w - 120, "left");
        for (const line of introLines) {
          ctx.fillText(line, 60, y);
          y += 18;
        }
        y += 6;
        // Draw numbered items without the section title (already drawn)
        for (let i = 0; i < startBuilding.length; i++) {
          y += 28;
          ctx.fillStyle = "#F5C423";
          ctx.beginPath();
          ctx.arc(76, y - 5, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 13px 'Roboto', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(i + 1), 76, y - 1);
          ctx.textAlign = "left";
          ctx.fillStyle = "#333";
          ctx.font = "15px 'Roboto', sans-serif";
          const stepLines = wrapText(ctx, startBuilding[i], w - 160, "left");
          for (const line of stepLines) {
            ctx.fillText(line, 100, y);
            y += 22;
          }
          y += 4;
        }
      }

      y += 20;

      // Careers service prompt
      ctx.fillStyle = "#53D88B";
      ctx.font = "600 18px 'Secular One', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Ask Your Careers Service", 60, y);
      y += 12;

      const boxPadding = 16;
      ctx.font = "italic 14px 'Roboto', sans-serif";
      const promptLines = wrapText(ctx, `"${plan.careersPrompt}"`, w - 160, "left");
      const boxH = promptLines.length * 22 + boxPadding * 2;

      ctx.fillStyle = "#D3FFE3";
      roundRect(ctx, 60, y, w - 120, boxH, 8);
      ctx.fill();

      ctx.fillStyle = "#333";
      ctx.font = "italic 14px 'Roboto', sans-serif";
      ctx.textAlign = "left";
      let promptY = y + boxPadding + 16;
      for (const line of promptLines) {
        ctx.fillText(line, 60 + boxPadding, promptY);
        promptY += 22;
      }

      y += boxH + 30;

      ctx.fillStyle = "#999";
      ctx.font = "12px 'Roboto', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Built by Vamos, a student-first social enterprise.", w / 2, y);

      const finalH = y + 40;
      const trimmed = document.createElement("canvas");
      trimmed.width = w * scale;
      trimmed.height = finalH * scale;
      const trimCtx = trimmed.getContext("2d")!;
      trimCtx.drawImage(canvas, 0, 0);

      const blob = await new Promise<Blob>((resolve) =>
        trimmed.toBlob((b) => resolve(b!), "image/png")
      );
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = "vamos-action-plan.png";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isIOS || isAndroid) {
        window.open(url, "_blank");
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error("Failed to generate action plan:", err);
    } finally {
      setDownloading(false);
    }
  };

  const renderStepList = (items: string[], accentColor = "#53D88B") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div
            style={{
              minWidth: 24,
              height: 24,
              borderRadius: "50%",
              background: accentColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Roboto', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {i + 1}
          </div>
          <span
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: 14,
              color: "#333",
              lineHeight: 1.5,
            }}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ margin: "12px 0" }}>
      {/* Visual card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3FFE3",
          borderRadius: 12,
          padding: "20px 20px 20px",
          marginBottom: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <img src={vamosSrc} alt="Vamos" style={{ height: 32, objectFit: "contain" }} />
        </div>

        {/* Target role heading */}
        <h3
          style={{
            fontFamily: "'Secular One', sans-serif",
            fontSize: 18,
            color: "#53D88B",
            margin: "0 0 16px",
            textAlign: "center",
          }}
        >
          {plan.role}
        </h3>

        {/* Two-section or legacy layout */}
        {isLegacy ? (
          <div style={{ marginBottom: 16 }}>
            {renderStepList(legacySteps.slice(0, 3))}
          </div>
        ) : (
          <>
            {keepExploring.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontFamily: "'Secular One', sans-serif",
                    fontSize: 14,
                    color: "#53D88B",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Keep Exploring
                </p>
                {renderStepList(keepExploring)}
              </div>
            )}
            {startBuilding.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontFamily: "'Secular One', sans-serif",
                    fontSize: 14,
                    color: "#F5C423",
                    margin: "0 0 4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Start Building
                </p>
                <p
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: 12,
                    color: "#999",
                    fontStyle: "italic",
                    margin: "0 0 10px",
                    lineHeight: 1.4,
                  }}
                >
                  These experiences build skills that PMs, consultants, and policy professionals all need — so even if your direction shifts, none of this is wasted.
                </p>
                {renderStepList(startBuilding, "#F5C423")}
              </div>
            )}
          </>
        )}

        {/* Careers service prompt box */}
        <div
          style={{
            background: "#D3FFE3",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#53D88B",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Ask Your Careers Service
          </p>
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: 13,
              color: "#333",
              margin: 0,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            "{plan.careersPrompt}"
          </p>
        </div>

        {/* Where else these skills lead */}
        {connectedClusters.length > 0 && (
          <div
            style={{
              borderTop: "1px solid #E5E5E5",
              marginTop: 16,
              paddingTop: 16,
              background: "#F0FFF5",
              borderRadius: 8,
              padding: "14px 14px 12px",
            }}
          >
            <p
              style={{
                fontFamily: "'Secular One', sans-serif",
                fontSize: 14,
                color: "#53D88B",
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Where else these skills lead
            </p>
            <p
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: 13,
                color: "#555",
                margin: "0 0 10px",
                lineHeight: 1.5,
              }}
            >
              You've started exploring one direction. The skills you're building here — structured problem-solving, cross-functional communication, translating complex ideas for different audiences — are exactly what{" "}
              {formatClusterList(connectedClusters)} roles also look for. None of this is wasted if your direction shifts.
            </p>
            {onExploreMore && (
              <button
                onClick={onExploreMore}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#53D88B",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Explore {formatClusterList(connectedClusters)} in Vamos Pathfinder →
              </button>
            )}
          </div>
        )}

      </div>

      {/* Download button */}
      <button
        onClick={generatePDF}
        disabled={downloading}
        style={{
          width: "100%",
          background: downloading ? "#a3e4bc" : "#53D88B",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'Roboto', sans-serif",
          cursor: downloading ? "default" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {downloading ? "Generating..." : "📥 Download your action plan"}
      </button>

      {/* CTA card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3FFE3",
          borderRadius: 12,
          padding: "20px",
          marginTop: 10,
        }}
      >
        <h3
          style={{
            fontFamily: "'Secular One', sans-serif",
            fontSize: 16,
            color: "#53D88B",
            margin: "0 0 8px",
          }}
        >
          Ready to talk to a real person?
        </h3>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 14,
            color: "#555",
            margin: "0 0 10px",
          }}
        >
          Take this question to your careers service:
        </p>
        <div
          style={{
            background: "#D3FFE3",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: 13,
              color: "#333",
              margin: 0,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            "{plan.careersPrompt}"
          </p>
        </div>
        <button
          style={{
            width: "100%",
            background: "#53D88B",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Roboto', sans-serif",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          Book a careers appointment
        </button>
      </div>

      {/* Explore more button */}
      {onExploreMore && (
        <button
          onClick={onExploreMore}
          style={{
            width: "100%",
            background: "#FFFFFF",
            color: "#53D88B",
            border: "1.5px solid #53D88B",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Roboto', sans-serif",
            cursor: "pointer",
            transition: "all 0.2s",
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ArrowLeft size={16} />
          Explore more pathways
        </button>
      )}
    </div>
  );
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _align?: string
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default ActionPlanCard;
export type { ActionPlan };

