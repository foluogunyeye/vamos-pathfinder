import { Check, Lock } from "lucide-react";
import type { ActionPlan } from "./ActionPlanCard";

interface JourneyRoadmapProps {
  constellationShown: boolean;
  actionPlan: ActionPlan | null;
}

/** Wider rail so road-style path reads clearly */
const PANEL_WIDTH = 280;
const ROAD_COL_WIDTH = 108;
const GREEN = "#53D88B";
const GREY_FILL = "#f0f0f0";
const GREY_STROKE = "#d0d0d0";
const AMBER = "#F5C423";
const ROAD_BASE = "#06202E";
const ROAD_DASH = "#ffffff";
const MUTED = "#aaa";
const TEXT = "#333";

/**
 * Left rail: road-style path between nodules (landing page RoadSegment style), paired with ProgressSidebar.
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
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
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

        <RoadConnector flip={false} />

        {/* Plan */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
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

        <RoadConnector flip />

        {/* Build */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
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

        <RoadConnector flip={false} />

        {/* Reflect */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
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

/** Explore / Plan: white disc + green ring; amber ? until done, then Vamos green checkmark */
function ProgressNode({ complete }: { complete: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "#fff",
        border: `2px solid ${GREEN}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 1px 2px rgba(6, 32, 46, 0.08)",
      }}
    >
      {complete ? (
        <Check size={16} color={GREEN} strokeWidth={2.75} aria-hidden />
      ) : (
        <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, userSelect: "none", color: AMBER }} aria-hidden>
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
        border: `2px solid ${GREY_STROKE}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        flexShrink: 0,
      }}
    >
      <Lock size={13} strokeWidth={2.25} aria-hidden />
    </div>
  );
}

/**
 * Road connector — same language as landing WelcomeScreen RoadSegment:
 * dark asphalt (#06202E) + white dashed centre line.
 */
function RoadConnector({ flip }: { flip?: boolean }) {
  const d = flip
    ? "M 26 3 C 26 22 82 24 82 42 C 82 52 26 54 26 66"
    : "M 82 3 C 82 22 26 24 26 42 C 26 52 82 54 82 66";

  return (
    <div
      style={{
        width: ROAD_COL_WIDTH,
        height: 52,
        flexShrink: 0,
        alignSelf: "flex-start",
        marginLeft: 0,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <svg
        width="100%"
        height="52"
        viewBox="0 0 108 70"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        aria-hidden
      >
        {/* Proportional to WelcomeScreen RoadSegment (~19.5 / 400 width) */}
        <path d={d} fill="none" stroke={ROAD_BASE} strokeWidth={5.5} strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke={ROAD_DASH}
          strokeWidth={1.1}
          strokeDasharray="8 6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
