import { Check, Lock } from "lucide-react";
import type { ActionPlan } from "./ActionPlanCard";

interface JourneyRoadmapProps {
  constellationShown: boolean;
  actionPlan: ActionPlan | null;
}

const PANEL_WIDTH = 280;
const ROAD_COL_WIDTH = 108;
const GREEN = "#53D88B";
const GREY_FILL = "#9ca3af";
const AMBER = "#F5C423";
/** Navy vertical dashed connectors between journey nodes */
const CONNECTOR_NAVY = "#1e3a5f";
const MUTED = "#aaa";
const TEXT = "#333";
/** Horizontal space between circle nodes and Explore / Plan / Build / Reflect labels */
const LABEL_ROW_GAP = 16;

/**
 * Left rail: vertical dashed navy lines between nodes, paired with ProgressSidebar.
 */
export default function JourneyRoadmap({ constellationShown, actionPlan }: JourneyRoadmapProps) {
  const exploreComplete = constellationShown;
  const planComplete = !!actionPlan;

  return (
    <div
      className="animate-fade-in"
      style={{
        width: PANEL_WIDTH,
        padding: "20px 18px",
        fontFamily: "'Roboto', sans-serif",
        fontSize: 12,
        color: TEXT,
        borderRight: "1px solid #f0f0f0",
        overflowY: "auto",
        flexShrink: 0,
        height: "100dvh",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: TEXT,
          margin: "0 0 18px",
          lineHeight: 1.35,
        }}
      >
        Your journey
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Explore */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: LABEL_ROW_GAP }}>
          <div
            style={{
              width: ROAD_COL_WIDTH,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ProgressNode complete={exploreComplete} />
          </div>
          <LabelBlock title="Explore" complete={exploreComplete} detail="Industry Constellation" />
        </div>

        <RoadConnector />

        {/* Plan */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: LABEL_ROW_GAP }}>
          <div
            style={{
              width: ROAD_COL_WIDTH,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ProgressNode complete={planComplete} />
          </div>
          <LabelBlock title="Plan" complete={planComplete} detail="Action Plan" />
        </div>

        <RoadConnector />

        {/* Build */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: LABEL_ROW_GAP }}>
          <div
            style={{
              width: ROAD_COL_WIDTH,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LockedNode />
          </div>
          <LabelBlock title="Build" comingSoon />
        </div>

        <RoadConnector />

        {/* Reflect */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: LABEL_ROW_GAP }}>
          <div
            style={{
              width: ROAD_COL_WIDTH,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LockedNode />
          </div>
          <LabelBlock title="Reflect" comingSoon />
        </div>
      </div>
    </div>
  );
}

function LabelBlock({
  title,
  complete,
  detail,
  comingSoon,
}: {
  title: string;
  complete?: boolean;
  detail?: string;
  comingSoon?: boolean;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: comingSoon ? MUTED : TEXT, lineHeight: 1.25 }}>{title}</div>
      {comingSoon ? (
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.3 }}>Coming soon</div>
      ) : (
        complete &&
        detail && (
          <div style={{ fontSize: 10, color: GREEN, marginTop: 3, fontWeight: 500, lineHeight: 1.3 }}>{detail}</div>
        )
      )}
    </div>
  );
}

/** Explore / Plan: solid amber + white ?; complete → solid Vamos green + white check */
function ProgressNode({ complete }: { complete: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: complete ? GREEN : AMBER,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 1px 2px rgba(6, 32, 46, 0.12)",
      }}
    >
      {complete ? (
        <Check size={16} color="#ffffff" strokeWidth={2.75} aria-hidden />
      ) : (
        <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, userSelect: "none", color: "#ffffff" }} aria-hidden>
          ?
        </span>
      )}
    </div>
  );
}

function LockedNode() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: GREY_FILL,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Lock size={13} strokeWidth={2.25} color="#ffffff" aria-hidden />
    </div>
  );
}

/** Plain vertical navy dashed line between node circles */
function RoadConnector() {
  const h = 52;
  const cx = ROAD_COL_WIDTH / 2;

  return (
    <div
      style={{
        width: ROAD_COL_WIDTH,
        height: h,
        flexShrink: 0,
        alignSelf: "flex-start",
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${ROAD_COL_WIDTH} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        aria-hidden
      >
        <line
          x1={cx}
          y1={0}
          x2={cx}
          y2={h}
          stroke={CONNECTOR_NAVY}
          strokeWidth={2}
          strokeDasharray="14 8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
