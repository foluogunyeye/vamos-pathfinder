import { Check, MapPin } from "lucide-react";
import { CLUSTERS } from "@/data/constellationData";
import type { Stage } from "./StageBadge";
import type { ActionPlan } from "./ActionPlanCard";
import type { Roadmap } from "./RoadmapCard";

interface ProgressSidebarProps {
  exploredClusters: string[];
  currentStage: Stage;
  actionPlan: ActionPlan | null;
  roadmapShown: boolean;
  roadmap: Roadmap | null;
  isAuthenticated: boolean;
  onClusterNavigate?: (clusterId: string) => void;
}

const stageColors: Record<Stage, string> = {
  Explore: "#53D88B",
  Plan: "#F5C423",
  Build: "#53D88B",
  Reflect: "#F5C423",
};

const ProgressSidebar = ({
  exploredClusters,
  currentStage,
  actionPlan,
  roadmapShown,
  roadmap,
  isAuthenticated,
  onClusterNavigate,
}: ProgressSidebarProps) => {
  const actionPlanReady = !!actionPlan;
  const roadmapReady = roadmapShown && !!roadmap;
  const actionPlanGateOpen = currentStage === "Build" || currentStage === "Reflect" ? roadmapReady : true;

  const planPreviewSteps = (() => {
    if (!actionPlan) return [];
    const steps = [
      ...(actionPlan.startBuilding ?? []),
      ...(actionPlan.keepExploring ?? []),
    ].filter(Boolean);
    return steps.slice(0, 2);
  })();

  const roadmapBreakdown = (() => {
    if (!roadmap || !Array.isArray((roadmap as any).milestones)) return null;
    const milestones = (roadmap as any).milestones as Array<{ type?: string }>;
    const counts: Record<string, number> = {};
    for (const m of milestones) {
      const t = (m.type ?? "").toLowerCase();
      if (!t) continue;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    const total = milestones.length;
    const parts: string[] = [];
    const order: Array<[string, string]> = [
      ["skill", "Skill"],
      ["network", "Network"],
      ["experience", "Experience"],
      ["qualification", "Qualification"],
    ];
    for (const [k, label] of order) {
      const n = counts[k] ?? 0;
      if (n > 0) parts.push(`${n} ${label}`);
    }
    if (parts.length === 0) return `${total} milestones`;
    return `${total} milestones: ${parts.join(", ")}`;
  })();

  const CheckboxRow = ({
    label,
    checked,
    disabled,
  }: {
    label: string;
    checked: boolean;
    disabled?: boolean;
  }) => {
    const border = checked ? "#53D88B" : "#ccc";
    const fill = checked ? "#53D88B" : "transparent";
    const text = disabled ? "#bbb" : "#333";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: disabled ? 0.55 : 1 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: fill,
            border: `1.5px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
          aria-hidden
        >
          {checked && <Check size={10} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ fontSize: 12, color: text, fontWeight: 500 }}>{label}</span>
      </div>
    );
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        width: 220,
        padding: "20px 16px",
        fontFamily: "'Roboto', sans-serif",
        fontSize: 12,
        color: "#666",
        borderLeft: "1px solid #f0f0f0",
        overflowY: "auto",
        flexShrink: 0,
        height: "100dvh",
        boxSizing: "border-box",
      }}
    >
      {/* Stage indicator */}
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            color: "#aaa",
            margin: "0 0 8px",
          }}
        >
          Current Stage
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: `${stageColors[currentStage]}18`,
            color: stageColors[currentStage],
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: stageColors[currentStage],
            }}
          />
          {currentStage}
        </div>
      </div>

      {/* Explored clusters — only for the current conversation once at least one cluster was opened */}
      {exploredClusters.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#aaa",
              margin: "0 0 10px",
            }}
          >
            Clusters Explored
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CLUSTERS.map((cluster) => {
              const visited = exploredClusters.includes(cluster.id);
              const canNavigate = !visited && onClusterNavigate;
              return (
                <div
                  key={cluster.id}
                  onClick={() => canNavigate && onClusterNavigate(cluster.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: visited ? 1 : 0.4,
                    transition: "opacity 0.3s",
                    cursor: canNavigate ? "pointer" : "default",
                  }}
                  title={canNavigate ? `Jump to ${cluster.title} on the constellation` : undefined}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: visited ? "#53D88B" : "transparent",
                      border: visited ? "none" : "1.5px solid #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.3s",
                    }}
                  >
                    {visited && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: visited ? "#333" : "#aaa",
                      fontWeight: visited ? 500 : 400,
                      transition: "color 0.3s",
                      textDecoration: canNavigate ? "underline" : "none",
                      textDecorationColor: canNavigate ? "#ccc" : undefined,
                    }}
                  >
                    {cluster.title}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "#aaa", margin: "8px 0 0" }}>
            {exploredClusters.length} of {CLUSTERS.length} explored
          </p>
        </div>
      )}

      {/* Toolkit output progress (Plan/Build/Reflect). Explore already handled by constellation/clusters above. */}
      {currentStage !== "Explore" && (
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#aaa",
              margin: "0 0 10px",
            }}
          >
            Toolkit outputs
          </p>

          {/* Plan: action plan only */}
          {currentStage === "Plan" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CheckboxRow label="Action plan" checked={actionPlanReady} />
              {actionPlanReady && (
                <div
                  style={{
                    background: "#F0FFF5",
                    border: "1px solid #D3FFE3",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#53D88B", marginBottom: 6 }}>
                    {actionPlan?.role ?? "Your direction"}
                  </div>
                  {planPreviewSteps.slice(0, 2).map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#555", lineHeight: 1.4, marginTop: i === 0 ? 0 : 4 }}>
                      {i + 1}. {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Build/Reflect: roadmap then gated action plan */}
          {(currentStage === "Build" || currentStage === "Reflect") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CheckboxRow label="Roadmap" checked={roadmapReady} />
                {roadmapReady && (
                  <div
                    style={{
                      background: "#F6FFFA",
                      border: "1px solid #D3FFE3",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#53D88B", marginBottom: 4 }}>
                      {roadmap?.goal ?? "Your direction"}
                    </div>
                    <div style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>
                      {roadmapBreakdown ?? "Roadmap generated"}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CheckboxRow label="Action plan" checked={actionPlanReady} disabled={!actionPlanGateOpen} />
                {actionPlanReady && (
                  <div
                    style={{
                      background: "#F0FFF5",
                      border: "1px solid #D3FFE3",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#53D88B", marginBottom: 6 }}>
                      {actionPlan?.role ?? "Your direction"}
                    </div>
                    {planPreviewSteps.slice(0, 2).map((s, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#555", lineHeight: 1.4, marginTop: i === 0 ? 0 : 4 }}>
                        {i + 1}. {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth status */}
      {isAuthenticated && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "#aaa",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#53D88B" }} />
          Progress synced
        </div>
      )}
    </div>
  );
};

export default ProgressSidebar;

