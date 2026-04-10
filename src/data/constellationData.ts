export interface ClusterData {
  id: string;
  title: string;
  label: string[];
  x: number;
  y: number;
  description: string;
}

export interface Connection {
  from: string;
  to: string;
  skill: string;
}

export const CLUSTERS: ClusterData[] = [
  { id: "govtech", title: "GovTech", label: ["GovTech"], x: 275, y: 44, description: "Technology roles in government, digital services, civic platforms, regulatory technology. Your policy instincts become a superpower here." },
  { id: "policy", title: "Policy", label: ["Policy"], x: 40, y: 174, description: "Shaping regulation, legislation, and institutional rules. Strong fit for analytical thinkers who want to understand how systems are governed." },
  { id: "data", title: "Data & Analytics", label: ["Data &", "Analytics"], x: 510, y: 174, description: "Translating data into strategic decisions, no coding required. Roles like business analyst, research analyst, or insights manager." },
  { id: "social", title: "Social Impact", label: ["Social", "Impact"], x: 70, y: 364, description: "Mission-driven work in NGOs, social enterprises, and impact funds. Your policy understanding and critical thinking drive real change." },
  { id: "consulting", title: "Consulting", label: ["Consulting"], x: 275, y: 434, description: "Solving complex problems across industries. Structured thinking, communication, and research skills are the core toolkit." },
  { id: "product", title: "Product Management", label: ["Product", "Management"], x: 480, y: 364, description: "Leading products from strategy to delivery. You don't code, you synthesize user needs, business goals, and technical possibilities." },
];

export const CONNECTIONS: Connection[] = [
  { from: "govtech", to: "policy", skill: "Systems thinking" },
  { from: "govtech", to: "data", skill: "Evidence-based decisions" },
  { from: "govtech", to: "social", skill: "Public sector innovation" },
  { from: "govtech", to: "product", skill: "Cross-functional leadership" },
  { from: "policy", to: "social", skill: "Advocacy & policy design" },
  { from: "policy", to: "consulting", skill: "Strategic communication" },
  { from: "social", to: "consulting", skill: "Stakeholder engagement" },
  { from: "consulting", to: "product", skill: "Structured problem-solving" },
  { from: "product", to: "data", skill: "Research & metrics" },
  { from: "consulting", to: "data", skill: "Analytical frameworks" },
];

export const CLUSTER_MAP = Object.fromEntries(CLUSTERS.map((c) => [c.id, c]));

/**
 * Given a cluster ID, returns the titles of all clusters connected to it
 * via shared transferable skills.
 */
export function getConnectedClusterNames(clusterId: string): string[] {
  const connected = new Set<string>();
  for (const conn of CONNECTIONS) {
    if (conn.from === clusterId) connected.add(conn.to);
    if (conn.to === clusterId) connected.add(conn.from);
  }
  return Array.from(connected).map((id) => CLUSTER_MAP[id]?.title).filter(Boolean);
}

