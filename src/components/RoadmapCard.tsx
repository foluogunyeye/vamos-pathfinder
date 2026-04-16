import { useState } from "react";
import vamosSrc from "@/assets/vamos_logo_SQUARE.png";

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: "experience" | "skill" | "network" | "qualification";
  priority: "high" | "medium" | "low";
}

interface Roadmap {
  goal: string;
  milestones: Milestone[];
}

interface RoadmapCardProps {
  roadmap: Roadmap;
}

const TYPE_CONFIG: Record<
  Milestone["type"],
  { label: string; color: string; bg: string; icon: string }
> = {
  experience: { label: "Experience", color: "#53D88B", bg: "#D3FFE3", icon: "💼" },
  skill: { label: "Skill", color: "#F5C423", bg: "#FFF8E1", icon: "🛠" },
  network: { label: "Network", color: "#5B8DEF", bg: "#E3EDFF", icon: "🤝" },
  qualification: { label: "Qualification", color: "#E07CE0", bg: "#F9E3F9", icon: "🎓" },
};

const PRIORITY_BORDER: Record<Milestone["priority"], string> = {
  high: "2px solid",
  medium: "1px solid #E5E5E5",
  low: "1px solid #E5E5E5",
};

const RoadmapCard = ({ roadmap }: RoadmapCardProps) => {
  const [downloading, setDownloading] = useState(false);

  // Group milestones by type, preserving order of first appearance
  const grouped: { type: Milestone["type"]; items: Milestone[] }[] = [];
  const seen = new Set<Milestone["type"]>();
  for (const m of roadmap.milestones) {
    if (!seen.has(m.type)) {
      seen.add(m.type);
      grouped.push({ type: m.type, items: [] });
    }
    grouped.find((g) => g.type === m.type)!.items.push(m);
  }

  // Sort high priority first within each group
  for (const group of grouped) {
    group.items.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }

  const generatePNG = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      const w = 800;
      const estimatedH = 1800;
      canvas.width = w * scale;
      canvas.height = estimatedH * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, estimatedH);

      // Logo
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
      ctx.fillText("Your Milestone Roadmap", w / 2, y);
      y += 40;

      ctx.fillStyle = "#666";
      ctx.font = "14px 'Roboto', sans-serif";
      ctx.fillText("TARGET DIRECTION", w / 2, y);
      y += 28;

      ctx.fillStyle = "#222";
      ctx.font = "bold 20px 'Roboto', sans-serif";
      const goalLines = wrapText(ctx, roadmap.goal, w - 120);
      for (const line of goalLines) {
        ctx.fillText(line, w / 2, y);
        y += 28;
      }
      y += 24;

      // Draw grouped milestones
      for (const group of grouped) {
        const config = TYPE_CONFIG[group.type];

        ctx.textAlign = "left";
        ctx.fillStyle = config.color;
        ctx.font = "600 18px 'Secular One', sans-serif";
        ctx.fillText(`${config.icon}  ${config.label}`, 60, y);
        y += 16;

        for (const m of group.items) {
          const isHigh = m.priority === "high";

          // Card background
          ctx.fillStyle = isHigh ? config.bg : "#FAFAFA";
          roundRect(ctx, 60, y, w - 120, 0, 8); // measure first

          ctx.font = "bold 15px 'Roboto', sans-serif";
          const titleLines = wrapText(ctx, m.title, w - 180);
          ctx.font = "14px 'Roboto', sans-serif";
          const descLines = wrapText(ctx, m.description, w - 180);

          const cardH = titleLines.length * 22 + descLines.length * 20 + 30;

          ctx.fillStyle = isHigh ? config.bg : "#FAFAFA";
          roundRect(ctx, 60, y, w - 120, cardH, 8);
          ctx.fill();

          if (isHigh) {
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 2;
            roundRect(ctx, 60, y, w - 120, cardH, 8);
            ctx.stroke();
          }

          let cardY = y + 18;
          ctx.fillStyle = "#222";
          ctx.font = "bold 15px 'Roboto', sans-serif";
          for (const line of titleLines) {
            ctx.fillText(line, 76, cardY);
            cardY += 22;
          }

          ctx.fillStyle = "#555";
          ctx.font = "14px 'Roboto', sans-serif";
          for (const line of descLines) {
            ctx.fillText(line, 76, cardY);
            cardY += 20;
          }

          y += cardH + 10;
        }

        y += 16;
      }

      y += 10;
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
      link.download = "vamos-milestone-roadmap.png";
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
      console.error("Failed to generate roadmap:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ margin: "12px 0" }}>
      {/* Main card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3FFE3",
          borderRadius: 12,
          padding: "20px",
          marginBottom: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <img src={vamosSrc} alt="Vamos" style={{ height: 32, objectFit: "contain" }} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Secular One', sans-serif",
            fontSize: 18,
            color: "#53D88B",
            margin: "0 0 4px",
            textAlign: "center",
          }}
        >
          Your Milestone Roadmap
        </h3>

        {/* Goal */}
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 13,
            color: "#666",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 4px",
          }}
        >
          Target Direction
        </p>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#222",
            textAlign: "center",
            margin: "0 0 20px",
          }}
        >
          {roadmap.goal}
        </p>

        {/* Intro text */}
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 13,
            color: "#777",
            lineHeight: 1.5,
            margin: "0 0 20px",
            fontStyle: "italic",
          }}
        >
          These milestones aren't sequential steps — they're things to build in parallel based on what's
          available to you right now. Start with the highlighted ones.
        </p>

        {/* Grouped milestones */}
        {grouped.map((group) => {
          const config = TYPE_CONFIG[group.type];
          return (
            <div key={group.type} style={{ marginBottom: 20 }}>
              {/* Group header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>{config.icon}</span>
                <p
                  style={{
                    fontFamily: "'Secular One', sans-serif",
                    fontSize: 14,
                    color: config.color,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {config.label}
                </p>
              </div>

              {/* Milestone cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.items.map((m) => {
                  const isHigh = m.priority === "high";
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: isHigh ? config.bg : "#FAFAFA",
                        border: isHigh ? `2px solid ${config.color}` : "1px solid #E5E5E5",
                        borderRadius: 8,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Roboto', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#222",
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {m.title}
                        </p>
                        {isHigh && (
                          <span
                            style={{
                              fontFamily: "'Roboto', sans-serif",
                              fontSize: 11,
                              fontWeight: 600,
                              color: config.color,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            Start here
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontSize: 13,
                          color: "#555",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {m.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Download button */}
      <button
        onClick={generatePNG}
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
        {downloading ? "Generating..." : "📥 Download your milestone roadmap"}
      </button>
    </div>
  );
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

export default RoadmapCard;
export type { Roadmap, Milestone };

