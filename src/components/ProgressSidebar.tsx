import { useState } from "react";
import { Check, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { CLUSTERS } from "@/data/constellationData";
import type { Stage } from "./StageBadge";
import type { ActionPlan } from "./ActionPlanCard";

interface ProgressSidebarProps {
  exploredClusters: string[];
  currentStage: Stage;
  actionPlan: ActionPlan | null;
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
  isAuthenticated,
  onClusterNavigate,
}: ProgressSidebarProps) => {
  const [planExpanded, setPlanExpanded] = useState(false);

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

      {/* Explored clusters */}
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
        {exploredClusters.length > 0 && (
          <p style={{ fontSize: 11, color: "#aaa", margin: "8px 0 0" }}>
            {exploredClusters.length} of {CLUSTERS.length} explored
          </p>
        )}
      </div>

      {/* Action plan summary */}
      {actionPlan && (
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
            Action Plan
          </p>
          <button
            onClick={() => setPlanExpanded(!planExpanded)}
            style={{
              width: "100%",
              background: "#F0FFF5",
              border: "1px solid #D3FFE3",
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#53D88B" }}>
                {actionPlan.role}
              </span>
              {planExpanded ? (
                <ChevronUp size={14} color="#53D88B" />
              ) : (
                <ChevronDown size={14} color="#53D88B" />
              )}
            </div>
            {planExpanded && (
              <div style={{ marginTop: 10 }}>
                {actionPlan.keepExploring && actionPlan.keepExploring.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#53D88B", margin: "0 0 4px", textTransform: "uppercase" }}>
                      Keep Exploring
                    </p>
                    {actionPlan.keepExploring.map((item, i) => (
                      <p key={i} style={{ fontSize: 11, color: "#555", margin: "0 0 3px", lineHeight: 1.4 }}>
                        {i + 1}. {item}
                      </p>
                    ))}
                  </div>
                )}
                {actionPlan.startBuilding && actionPlan.startBuilding.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#F5C423", margin: "0 0 4px", textTransform: "uppercase" }}>
                      Start Building
                    </p>
                    {actionPlan.startBuilding.map((item, i) => (
                      <p key={i} style={{ fontSize: 11, color: "#555", margin: "0 0 3px", lineHeight: 1.4 }}>
                        {i + 1}. {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </button>
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

