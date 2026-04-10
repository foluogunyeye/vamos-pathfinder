import type { ActionPlan } from "./ActionPlanCard";

interface JourneyRoadmapProps {
  constellationShown: boolean;
  actionPlan: ActionPlan | null;
}

const PANEL_WIDTH = 220;
const GREEN = "#53D88B";
const GREY_FILL = "#f5f5f5";
const GREY_STROKE = "#d0d0d0";
const PATH_STROKE = "#e5e5e5";
const MUTED = "#aaa";
const TEXT = "#666";

/**
 * Left rail: vertical S-curve journey map, styled to pair with ProgressSidebar (right).
 */
export default function JourneyRoadmap({ constellationShown, actionPlan }: JourneyRoadmapProps) {
  const exploreActive = constellationShown;
  const planActive = !!actionPlan;

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
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "#aaa",
          margin: "0 0 16px",
        }}
      >
        Your journey
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        {/* S-curve spine + nodes */}
        <div style={{ width: 40, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <JourneyNode active={exploreActive} />
          <SConnector flip={false} />
          <JourneyNode active={planActive} />
          <SConnector flip />
          <JourneyNode dim />
          <SConnector flip={false} />
          <JourneyNode dim />
        </div>

        {/* Stage copy — mirrors sidebar typography */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          <StageCopy title="Explore" active={exploreActive} activeDetail="Industry Constellation" />
          <div style={{ height: 28 }} />
          <StageCopy title="Plan" active={planActive} activeDetail="Action Plan" />
          <div style={{ height: 28 }} />
          <StageCopy title="Build" comingSoon />
          <div style={{ height: 28 }} />
          <StageCopy title="Reflect" comingSoon />
        </div>
      </div>
    </div>
  );
}

function JourneyNode({ active, dim }: { active?: boolean; dim?: boolean }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: active ? GREEN : GREY_FILL,
        border: `2px solid ${active ? GREEN : dim ? GREY_STROKE : GREY_STROKE}`,
        boxSizing: "border-box",
        flexShrink: 0,
        opacity: dim ? 0.75 : 1,
      }}
    />
  );
}

/** Short vertical S fragment between two nodes */
function SConnector({ flip }: { flip?: boolean }) {
  const d = flip
    ? "M 20 0 C 6 5, 6 12, 20 16 C 34 21, 34 26, 20 28"
    : "M 20 0 C 34 5, 34 12, 20 16 C 6 21, 6 26, 20 28";
  return (
    <svg width={40} height={28} viewBox="0 0 40 28" style={{ display: "block" }} aria-hidden>
      <path d={d} fill="none" stroke={PATH_STROKE} strokeWidth={2.25} strokeLinecap="round" />
    </svg>
  );
}

function StageCopy({
  title,
  active,
  activeDetail,
  comingSoon,
}: {
  title: string;
  active?: boolean;
  activeDetail?: string;
  comingSoon?: boolean;
}) {
  return (
    <div style={{ minHeight: 44 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: active ? GREEN : comingSoon ? MUTED : MUTED,
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      {comingSoon ? (
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Coming soon</div>
      ) : (
        active &&
        activeDetail && (
          <div style={{ fontSize: 10, color: GREEN, marginTop: 4, fontWeight: 500 }}>{activeDetail}</div>
        )
      )}
    </div>
  );
}
