import { useState, useCallback } from "react";
import { CLUSTERS, CONNECTIONS, CLUSTER_MAP, type ClusterData } from "@/data/constellationData";

interface IndustryConstellationProps {
  onClusterClick?: (clusterId: string, title: string) => void;
  highlightClusterId?: string | null;
}

const W = 130;
const H = 52;

const getCenter = (c: ClusterData) => ({ cx: c.x + W / 2, cy: c.y + H / 2 });

const IndustryConstellation = ({ onClusterClick, highlightClusterId }: IndustryConstellationProps) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClusterData | null>(null);
  
  const connectedTo = useCallback(
    (id: string) => {
      if (!hovered) return false;
      return CONNECTIONS.some(
        (c) =>
          (c.from === hovered && c.to === id) ||
          (c.to === hovered && c.from === id)
      );
    },
    [hovered]
  );

  const isEdgeActive = useCallback(
    (conn: { from: string; to: string }) => {
      if (!hovered) return false;
      return conn.from === hovered || conn.to === hovered;
    },
    [hovered]
  );

  const handleClick = (cluster: ClusterData) => {
    setSelected(cluster);
    onClusterClick?.(cluster.id, cluster.title);
  };

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>
      <p
        style={{
          color: "#53D88B",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2.5,
          textAlign: "center",
          margin: "0 0 2px",
        }}
      >
        INDUSTRY CONSTELLATION
      </p>
      <p
        style={{
          color: "#888",
          fontSize: 12,
          textAlign: "center",
          margin: "0 0 2px",
        }}
      >
        Hover over a connection to see the skills that link careers together.
      </p>
      <p
        style={{
          color: "#888",
          fontSize: 12,
          textAlign: "center",
          margin: "0 0 10px",
        }}
      >
        Click any cluster to explore roles and pathways.
      </p>

      <svg viewBox="0 0 680 530" width="100%" style={{ display: "block" }}>
        {CONNECTIONS.map((conn) => {
          const a = getCenter(CLUSTER_MAP[conn.from]);
          const b = getCenter(CLUSTER_MAP[conn.to]);
          const active = isEdgeActive(conn);
          const mx = (a.cx + b.cx) / 2;
          const my = (a.cy + b.cy) / 2;
          const labelW = conn.skill.length * 6.5 + 20;

          return (
            <g key={`${conn.from}-${conn.to}`}>
              <line
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke={active ? "#F5C423" : "#D3FFE3"}
                strokeWidth={active ? 2.5 : 1.5}
                style={{ transition: "stroke 0.35s, stroke-width 0.35s" }}
              />
              <g
                style={{
                  opacity: active ? 1 : 0,
                  transition: "opacity 0.35s",
                  pointerEvents: "none",
                }}
              >
                <rect
                  x={mx - labelW / 2}
                  y={my - 12}
                  width={labelW}
                  height={22}
                  rx={11}
                  fill="#D3FFE3"
                />
                <text
                  x={mx}
                  y={my + 3}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={500}
                  fill="#1a6b3a"
                >
                  {conn.skill}
                </text>
              </g>
            </g>
          );
        })}

        {CLUSTERS.map((cluster) => {
          const isHovered = hovered === cluster.id;
          const isConnected = connectedTo(cluster.id);
          const isHighlighted = highlightClusterId === cluster.id;
          const dimmed = hovered && !isHovered && !isConnected;

          return (
            <g
              key={cluster.id}
              style={{
                cursor: "pointer",
                opacity: dimmed ? 0.22 : 1,
                transition: "opacity 0.35s",
              }}
              onMouseEnter={() => setHovered(cluster.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(cluster)}
            >
              <rect
                x={cluster.x}
                y={cluster.y}
                width={W}
                height={H}
                rx={26}
                fill="#53D88B"
                stroke={isHighlighted ? "#F5C423" : isHovered ? "#F5C423" : "transparent"}
                strokeWidth={isHighlighted ? 3 : isHovered ? 3 : 0}
                style={{ transition: "stroke 0.35s, stroke-width 0.35s" }}
              >
                {isHighlighted && (
                  <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="3" />
                )}
              </rect>
              {cluster.label.length === 1 ? (
                <text
                  x={cluster.x + W / 2}
                  y={cluster.y + H / 2 + 5}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={14}
                  fontWeight={600}
                >
                  {cluster.label[0]}
                </text>
              ) : (
                <>
                  <text
                    x={cluster.x + W / 2}
                    y={cluster.y + H / 2 - 3}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={13}
                    fontWeight={600}
                  >
                    {cluster.label[0]}
                  </text>
                  <text
                    x={cluster.x + W / 2}
                    y={cluster.y + H / 2 + 13}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={13}
                    fontWeight={600}
                  >
                    {cluster.label[1]}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {selected && (
        <div
          style={{
            background: "#D3FFE3",
            borderRadius: 14,
            padding: "16px 20px",
            marginTop: 10,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: 700,
              fontSize: 15,
              color: "#1a6b3a",
            }}
          >
            {selected.title}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#1a6b3a", lineHeight: 1.5 }}>
            {selected.description}
          </p>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default IndustryConstellation;

