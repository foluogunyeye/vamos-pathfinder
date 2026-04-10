import { useEffect, useState } from "react";

export type Stage = "Explore" | "Plan" | "Build" | "Reflect";

const stageColors: Record<Stage, string> = {
  Explore: "rgba(83, 216, 139, 0.25)",
  Plan: "rgba(245, 196, 35, 0.25)",
  Build: "rgba(83, 216, 139, 0.25)",
  Reflect: "rgba(245, 196, 35, 0.25)",
};

const stageTextColors: Record<Stage, string> = {
  Explore: "#2da864",
  Plan: "#b8900a",
  Build: "#2da864",
  Reflect: "#b8900a",
};

interface StageBadgeProps {
  stage: Stage;
}

const StageBadge = ({ stage }: StageBadgeProps) => {
  const [visible, setVisible] = useState(false);
  const [displayStage, setDisplayStage] = useState(stage);

  useEffect(() => {
    setVisible(false);
    const timeout = setTimeout(() => {
      setDisplayStage(stage);
      setVisible(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, [stage]);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: stageColors[displayStage],
        color: stageTextColors[displayStage],
        fontFamily: "'Roboto', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 14px",
        borderRadius: 999,
        letterSpacing: "0.02em",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-4px)",
      }}
    >
      {displayStage}
    </span>
  );
};

export default StageBadge;

