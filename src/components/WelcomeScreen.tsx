import { ChevronRight, MapPin } from "lucide-react";
import vamosSrc from "@/assets/vamos_logo_SQUARE.png";

interface StageData {
  id: string;
  title: string;
  quote: string;
  bullets: string[];
  bg: string;
}

const STAGES: StageData[] = [
  {
    id: "explore",
    title: "Explore",
    quote: "I don't really know what I want to do with my life",
    bullets: [
      "Discover career pathways you've never heard of",
      "Get an interactive career map showing your options",
    ],
    bg: "#53D88B",
  },
  {
    id: "plan",
    title: "Plan",
    quote:
      "I have a direction in mind (like a field, a role, or a type of work) but I'm not sure what the path from here actually looks like or where to start.",
    bullets: [
      "See what the path from where you are to your goal actually looks like",
      "Get a concrete action plan for what to do now",
    ],
    bg: "#F5C423",
  },
  {
    id: "build",
    title: "Build",
    quote:
      "I know the job or field I'm working toward. I want to figure out what experiences, skills, and opportunities I should be going after to become a strong candidate.",
    bullets: [
      "Get a milestone roadmap for building your candidacy",
      "Find the right experiences, skills, and opportunities for your target role",
    ],
    bg: "#53D88B",
  },
  {
    id: "reflect",
    title: "Reflect",
    quote:
      "I've built up experience (internships, jobs, projects, or study) and I want to make sense of what it all points to and what comes next.",
    bullets: [
      "Find patterns in your experiences you can't see yet",
      "Map what energised you and what drained you to careers that fit",
    ],
    bg: "#F5C423",
  },
];


/* Decorative dots scattered near the road */
const DECO_DOTS = [
  { cx: 60, cy: 30, r: 3 },
  { cx: 320, cy: 15, r: 2.5 },
  { cx: 280, cy: 55, r: 2 },
  { cx: 100, cy: 70, r: 2 },
  { cx: 340, cy: 80, r: 3 },
  { cx: 50, cy: 90, r: 2 },
];

const RoadSegment = ({ flip }: { flip?: boolean }) => (
  <div className="relative h-20 md:h-24 w-full max-w-xl mx-auto overflow-visible">
    <svg
      viewBox="0 0 400 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className="absolute inset-0"
    >
      {/* Decorative dots */}
      {DECO_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={flip ? 400 - d.cx : d.cx}
          cy={d.cy}
          r={d.r}
          fill="#D3FFE3"
          opacity={0.7}
        />
      ))}
      {/* Road base */}
      <path
        d={
          flip
            ? "M 50,0 C 50,50 350,50 350,100"
            : "M 350,0 C 350,50 50,50 50,100"
        }
        fill="none"
        stroke="#06202E"
        strokeWidth="19.5"
        strokeLinecap="round"
      />
      {/* Centre dashes */}
      <path
        d={
          flip
            ? "M 50,0 C 50,50 350,50 350,100"
            : "M 350,0 C 350,50 50,50 50,100"
        }
        fill="none"
        stroke="white"
        strokeWidth="3.9"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const RoadTail = () => (
  <div className="relative h-24 w-full max-w-xl mx-auto flex flex-col items-center">
    <svg viewBox="0 0 400 80" width="100%" height="60" preserveAspectRatio="none">
      <path d="M 200,0 C 200,40 200,60 200,80" fill="none" stroke="#06202E" strokeWidth="19.5" strokeLinecap="round" />
      <path d="M 200,0 C 200,40 200,60 200,80" fill="none" stroke="white" strokeWidth="3.9" strokeDasharray="8 6" strokeLinecap="round" />
    </svg>
    
  </div>
);

interface SavedSessionSummary {
  clustersExplored: number;
  hasActionPlan: boolean;
  lastUpdated: string;
}

interface WelcomeScreenProps {
  onStageSelect: (stageId: string, stageTitle: string) => void;
  savedSession?: SavedSessionSummary | null;
  onContinueSession?: () => void;
  onSignOut?: () => void;
  isAuthenticated?: boolean;
}

const WelcomeScreen = ({ onStageSelect, savedSession, onContinueSession, onSignOut, isAuthenticated }: WelcomeScreenProps) => {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <div style={{ width: 60 }} />
        <div className="flex flex-col items-center" style={{ gap: "0px" }}>
          <div className="overflow-hidden" style={{ height: "68px" }}>
            <img src={vamosSrc} alt="Vamos logo" className="w-[84px] h-[84px] object-cover object-top" />
          </div>
          <span
            className="font-bold tracking-wide"
            style={{ color: "#53D88B", fontFamily: "'Secular One', sans-serif", fontSize: "1.5rem", marginTop: "-2px" }}
          >
            Pathfinder
          </span>
        </div>
        <div style={{ width: 60, textAlign: "right" }}>
          {isAuthenticated && onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: "#999",
                cursor: "pointer",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24 text-center" style={{ backgroundColor: "#D3FFE3" }}>
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-foreground font-bold leading-tight mb-5"
            style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)" }}
          >
            Stop stressing about job applications. Start figuring out what you actually want.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed max-w-xl mx-auto" style={{ color: "#5a7a6a" }}>
            Vamos Pathfinder is a free career navigator built for students, by students.
          </p>
          <span
            className="inline-block mt-5 px-4 py-1.5 rounded-full text-sm font-semibold border"
            style={{ color: "#53D88B", borderColor: "#53D88B", backgroundColor: "white" }}
          >
            100% free for students
          </span>
        </div>
      </section>

      {/* Continue where you left off */}
      {savedSession && onContinueSession && (
        <section className="px-6 py-8 bg-background">
          <div className="max-w-xl mx-auto">
            <div
              style={{
                background: "#FFFFFF",
                border: "2px solid #53D88B",
                borderRadius: 16,
                padding: "20px 24px",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onClick={onContinueSession}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(83,216,139,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <p
                style={{
                  fontFamily: "'Secular One', sans-serif",
                  fontSize: 16,
                  color: "#53D88B",
                  margin: "0 0 6px",
                }}
              >
                Continue where you left off
              </p>
              <p
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: 13,
                  color: "#666",
                  margin: "0 0 10px",
                  lineHeight: 1.5,
                }}
              >
                {savedSession.clustersExplored > 0 && `You explored ${savedSession.clustersExplored} ${savedSession.clustersExplored === 1 ? "industry" : "industries"}`}
                {savedSession.clustersExplored > 0 && savedSession.hasActionPlan && " and "}
                {savedSession.hasActionPlan && "generated an action plan"}
                {!savedSession.clustersExplored && !savedSession.hasActionPlan && "You have a saved conversation"}
                .
              </p>
              <span
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#53D88B",
                }}
              >
                Pick up where you left off →
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Journey map section */}
      <section className="px-6 py-12 md:py-16 bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-10">
            Where are you in your journey?
          </p>

          <div className="flex flex-col items-center">
            {STAGES.map((stage, idx) => (
              <div key={`${stage.id}-${idx}`} className="w-full flex flex-col items-center">
                {/* Card */}
                <div
                  className="w-full max-w-xl rounded-2xl p-10 md:p-12 flex flex-col transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    backgroundColor: stage.bg,
                    boxShadow: `0 4px 24px ${stage.bg}33`,
                  }}
                >
                  <MapPin className="w-7 h-7 mb-3" style={{ color: "#06202E" }} />

                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                    {stage.title}
                  </h2>
                  <p className="text-2xl md:text-3xl italic font-bold leading-snug mb-8 text-white/90">
                    "{stage.quote}"
                  </p>
                  <ul className="space-y-3 mb-8 flex-1 text-white">
                    {stage.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-base font-semibold leading-snug">
                        <span className="mt-1.5 shrink-0 block w-1.5 h-1.5 rounded-full bg-white/70" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onStageSelect(stage.id, stage.title)}
                    className="self-start inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-base font-bold cursor-pointer border-2 border-white text-white bg-transparent transition-all duration-150 hover:bg-white/20 active:scale-95"
                  >
                    Start here
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Road between cards */}
                {idx < STAGES.length - 1 && <RoadSegment flip={idx % 2 === 1} />}
              </div>
            ))}

            {/* Trailing road */}
            <RoadTail />
          </div>
        </div>
      </section>

      {/* Vamos Insights */}
      <section className="px-6 py-14 md:py-16" style={{ backgroundColor: "#D3FFE3" }}>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-lg">
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: "'Secular One', sans-serif", color: "#53D88B" }}
            >
              Vamos Insights
            </h2>
            <p className="text-foreground text-sm md:text-base leading-relaxed">
              Real career stories from real people. Our 'How I Got Here' series features young
              professionals who took unexpected paths, changed direction, and figured it out as
              they went along. Read their stories on Substack.
            </p>
          </div>
          <a
            href="https://vamos.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-center shrink-0 inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#53D88B" }}
          >
            Read on Substack
          </a>
        </div>
      </section>

      <footer className="px-6 py-8 mt-auto text-center">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          Built by Vamos, a student-first social enterprise.
        </p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;

