import { Check, Lock } from "lucide-react";
import type { ActionPlan } from "./ActionPlanCard";

interface JourneyRoadmapProps {
  constellationShown: boolean;
  actionPlan: ActionPlan | null;
}

const PANEL_WIDTH = 220;
const GREEN = "#53D88B";
const GREY_FILL = "#f0f0f0";
const GREY_STROKE = "#d0d0d0";
/** Gold / amber accent — matches existing palette (e.g. Plan stage accent) */
const PATH_AMBER = "#F5C423";
const MUTED = "#aaa";
const TEXT = "#333";

/**
 * Left rail: vertical S-curve journey map, styled to pair with ProgressSidebar (right).
 */
export default function JourneyRoadmap({ constellationShown, actionPlan }: JourneyRoadmapProps) {
  const exploreComplete = constellationShown;
  const planComplete = !!actionPlan;

  return (
    <div
      className="animate-fade-in"
      style={{
        width: PANEL_WIDTH,
        padding: "20px 16px",
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
              width: 36,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ProgressNode complete={exploreComplete} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.25 }}>Explore</div>
            {exploreComplete && (
              <div style={{ fontSize: 10, color: GREEN, marginTop: 3, fontWeight: 500, lineHeight: 1.3 }}>
                Industry Constellation
              </div>
            )}
          </div>
        </div>

        <SConnector flip={false} />

        {/* Plan */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ProgressNode complete={planComplete} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.25 }}>Plan</div>
            {planComplete && (
              <div style={{ fontSize: 10, color: GREEN, marginTop: 3, fontWeight: 500, lineHeight: 1.3 }}>
                Action Plan
              </div>
            )}
          </div>
        </div>

        <SConnector flip />

        {/* Build */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LockedNode />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, lineHeight: 1.25 }}>Build</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.3 }}>Coming soon</div>
          </div>
        </div>

        <SConnector flip={false} />

        {/* Reflect */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LockedNode />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, lineHeight: 1.25 }}>Reflect</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.3 }}>Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Explore / Plan: always green; ? until stage complete, then checkmark */
function ProgressNode({ complete }: { complete: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: GREEN,
        border: `2px solid ${GREEN}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {complete ? (
        <Check size={15} strokeWidth={2.75} aria-hidden />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, userSelect: "none" }} aria-hidden>
          ?
        </span>
      )}
    </div>
  );
}

/** Build / Reflect: grey circle + lock */
function LockedNode() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
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

/** S fragment between nodes — single amber colour */
function SConnector({ flip }: { flip?: boolean }) {
  const d = flip
    ? "M 18 0 C 4 5, 4 12, 18 16 C 32 21, 32 26, 18 28"
    : "M 18 0 C 32 5, 32 12, 18 16 C 4 21, 4 26, 18 28";
  return (
    <div style={{ paddingLeft: 9, margin: "2px 0" }}>
      <svg width={36} height={28} viewBox="0 0 36 28" style={{ display: "block" }} aria-hidden>
        <path d={d} fill="none" stroke={PATH_AMBER} strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    </div>
  );
}
