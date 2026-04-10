import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import IndustryConstellation from "./IndustryConstellation";
import WelcomeScreen from "./WelcomeScreen";
import StageBadge, { type Stage } from "./StageBadge";
import ActionPlanCard, { type ActionPlan } from "./ActionPlanCard";
import SaveProgressPrompt from "./SaveProgressPrompt";
import ProgressSavedToast from "./ProgressSavedToast";
import ProgressSidebar from "./ProgressSidebar";
import { getConnectedClusterNames } from "@/data/constellationData";
import { useAuth } from "@/hooks/useAuth";
import { useProgressSave, type SavedProgress } from "@/hooks/useProgressSave";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseEnv";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  showConstellation?: boolean;
}

const STAGE_REGEX = /^\[STAGE:(Explore|Plan|Build|Reflect)\]\s*/;
const ACTION_PLAN_REGEX = /\[ACTION_PLAN:\s*(\{[\s\S]*?\})\]\s*$/;
/** Strip from UI always; constellation UI only toggles on first trigger in this session. */
const SHOW_CONSTELLATION_RE = /\[SHOW_CONSTELLATION\]\s*/g;

function stripShowConstellationTag(text: string): string {
  return text.replace(SHOW_CONSTELLATION_RE, "").trim();
}

const PathfinderChat = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [constellationShown, setConstellationShown] = useState(false);
  const [stageContext, setStageContext] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>("Explore");
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [actionPlanCount, setActionPlanCount] = useState(0);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [highlightClusterId, setHighlightClusterId] = useState<string | null>(null);
  const [exploredClusters, setExploredClusters] = useState<string[]>([]);
  const [showSaveAfterConstellation, setShowSaveAfterConstellation] = useState(false);
  const [actionPlanOffered, setActionPlanOffered] = useState(false);
  const [showSaveAfterActionPlan, setShowSaveAfterActionPlan] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [savedSession, setSavedSession] = useState<{
    clustersExplored: number;
    hasActionPlan: boolean;
    lastUpdated: string;
  } | null>(null);
  const [savedProgressData, setSavedProgressData] = useState<SavedProgress | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading, signInWithMagicLink, signOut } = useAuth();
  const { saveProgress, loadProgress } = useProgressSave(user);

  const autoStartRef = useRef(false);

  // Load saved progress on auth
  useEffect(() => {
    if (!user) {
      setSavedSession(null);
      setSavedProgressData(null);
      return;
    }
    loadProgress().then((progress) => {
      if (progress && progress.conversation_history.length > 0) {
        setSavedProgressData(progress);
        setSavedSession({
          clustersExplored: progress.explored_clusters.length,
          hasActionPlan: !!progress.action_plan,
          lastUpdated: progress.updated_at,
        });
      }
    });
  }, [user, loadProgress]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-save when authenticated
  const doSave = useCallback(async () => {
    if (!user) return;
    const saved = await saveProgress({
      explored_clusters: exploredClusters,
      conversation_history: messages,
      action_plan: actionPlan,
      current_stage: currentStage,
      stage_context: stageContext,
      selected_cluster_id: selectedClusterId,
    });
    if (saved) setShowSavedToast(true);
  }, [user, saveProgress, exploredClusters, messages, actionPlan, currentStage, stageContext, selectedClusterId]);

  // Save after constellation shown (once user has clicked a cluster)
  useEffect(() => {
    if (user && constellationShown && exploredClusters.length > 0 && !isStreaming) {
      doSave();
    }
  }, [user, constellationShown, exploredClusters, isStreaming, doSave]);

  // Save after action plan generated
  useEffect(() => {
    if (user && actionPlan && !isStreaming) {
      doSave();
    }
  }, [user, actionPlan, isStreaming, doSave]);

  // Show save prompt after constellation exploration (only if not authenticated)
  useEffect(() => {
    if (!user && constellationShown && exploredClusters.length > 0 && !isStreaming) {
      setShowSaveAfterConstellation(true);
    }
  }, [user, constellationShown, exploredClusters, isStreaming]);

  // Show save prompt after action plan (only if not authenticated)
  useEffect(() => {
    if (!user && actionPlan && !isStreaming) {
      setShowSaveAfterActionPlan(true);
    }
  }, [user, actionPlan, isStreaming]);

  const sendMessages = useCallback(async (allMessages: ChatMessage[], ctxOverride?: string) => {
    setIsStreaming(true);

    const apiMessages = allMessages.map(({ role, content }) => ({ role, content }));
    const ctx = ctxOverride ?? stageContext;

    try {
      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      const res = await fetch(`${baseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          messages: apiMessages,
          stageContext: ctx,
          exploredClustersCount: exploredClusters.length,
          actionPlanOffered,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json);
            if (event.type === "content_block_delta" && event.delta?.text) {
              accumulated += event.delta.text;

              let display = accumulated;
              let showConst = false;

              const stageMatch = display.match(STAGE_REGEX);
              if (stageMatch) {
                setCurrentStage(stageMatch[1] as Stage);
                display = display.replace(STAGE_REGEX, "");
              }

              {
                const beforeConstellationStrip = display;
                display = display.replace(SHOW_CONSTELLATION_RE, "").trim();
                if (beforeConstellationStrip !== display && !constellationShown) {
                  showConst = true;
                  setConstellationShown(true);
                }
              }

              const actionPlanMatch = display.match(ACTION_PLAN_REGEX);
              if (actionPlanMatch) {
                try {
                  const parsed = JSON.parse(actionPlanMatch[1]) as ActionPlan;
                  setActionPlan(parsed);
                  setActionPlanCount(prev => prev + 1);
                  setActionPlanOffered(true);
                } catch {
                  // skip malformed
                }
                display = display.replace(ACTION_PLAN_REGEX, "").trim();
              }

              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: display,
                  showConstellation: showConst,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [constellationShown, stageContext, exploredClusters.length, actionPlanOffered]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: msg };
      const updated = [...messages, userMessage];
      setMessages(updated);
      setInput("");
      sendMessages(updated);
    },
    [input, isStreaming, messages, sendMessages]
  );

  const handleClusterClick = useCallback(
    (clusterId: string, title: string) => {
      setSelectedClusterId(clusterId);
      setExploredClusters((prev) => prev.includes(clusterId) ? prev : [...prev, clusterId]);
      const msg = `I'm curious about ${title}. Tell me more about what that looks like for someone with my background.`;
      setInput("");
      const userMessage: ChatMessage = { role: "user", content: msg };
      setMessages((prev) => {
        const next = [...prev, userMessage];
        sendMessages(next);
        return next;
      });
    },
    [sendMessages]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStageSelect = useCallback(
    (stageId: string, stageTitle: string) => {
      const stagePrompts: Record<string, string> = {
        explore: `The student is in the Explore stage. They resonated with: "I don't really know what I want to do with my life". Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "Hey! So you're figuring things out, and that's a great place to start. Most people who end up in interesting careers didn't have a plan at your stage, they had curiosity. Let's start there. What are you studying, and what kinds of things do you actually enjoy doing, in or outside of uni?"`,
        planbuild: `The student is in the Plan stage. They have some direction and need both a roadmap and practical experience-building guidance. Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "OK so you've got some direction, that's more than most people give themselves credit for. Tell me what you're thinking and where you are in your degree, and I'll help you figure out what to actually do next and what experiences to start building."`,
        reflect: `The student is in the Reflect stage. They resonated with: "I've done stuff but I still feel lost". Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "Sometimes the best way forward is to look back at what you've already done. Tell me about the experiences you've had so far, work, uni, volunteering, whatever, and what stood out to you. Good or bad, both are useful."`,
      };
      const ctx = stagePrompts[stageId] || stagePrompts.explore;
      setStageContext(ctx);
      setStarted(true);
      setMessages([]);
      setExploredClusters([]);
      setActionPlan(null);
      setActionPlanCount(0);
      setConstellationShown(false);
      setShowSaveAfterConstellation(false);
      setShowSaveAfterActionPlan(false);
      setCurrentStage(stageTitle as Stage);
      sendMessages([], ctx);
    },
    [sendMessages]
  );

  // Deep link: /pathfinder?stage=explore|planbuild|reflect
  // Starts the chosen flow once, then falls back to normal UI behavior.
  useEffect(() => {
    if (autoStartRef.current) return;
    if (started) return;
    if (authLoading) return;

    const stage = new URLSearchParams(location.search).get("stage");
    if (!stage) return;

    const stageId = stage.toLowerCase();
    if (stageId === "explore") {
      autoStartRef.current = true;
      handleStageSelect("explore", "Explore");
      return;
    }
    if (stageId === "planbuild") {
      autoStartRef.current = true;
      handleStageSelect("planbuild", "Plan");
      return;
    }
    if (stageId === "reflect") {
      autoStartRef.current = true;
      handleStageSelect("reflect", "Reflect");
    }
  }, [location.search, started, authLoading, handleStageSelect]);

  const handleContinueSession = useCallback(() => {
    if (!savedProgressData) return;
    setStarted(true);
    setMessages(savedProgressData.conversation_history);
    setExploredClusters(savedProgressData.explored_clusters);
    setActionPlan(savedProgressData.action_plan);
    setCurrentStage(savedProgressData.current_stage as Stage);
    setStageContext(savedProgressData.stage_context);
    setSelectedClusterId(savedProgressData.selected_cluster_id);
    setConstellationShown(savedProgressData.conversation_history.some(m => m.showConstellation));
    setActionPlanCount(savedProgressData.action_plan ? 1 : 0);
  }, [savedProgressData]);

  const handleMagicLinkSubmit = useCallback(async (email: string) => {
    return signInWithMagicLink(email);
  }, [signInWithMagicLink]);

  const handleClusterNavigate = useCallback((clusterId: string) => {
    setHighlightClusterId(clusterId);
    constellationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightClusterId(null), 4500);
  }, []);

  const handleReset = useCallback(() => {
    setMessages([]);
    setConstellationShown(false);
    setInput("");
    setStageContext(null);
    setStarted(false);
    setCurrentStage("Explore");
    setExploredClusters([]);
    setActionPlan(null);
    setActionPlanCount(0);
    setShowSaveAfterConstellation(false);
    setShowSaveAfterActionPlan(false);
    setHighlightClusterId(null);
  }, []);

  if (!started) {
    return (
      <WelcomeScreen
        onStageSelect={handleStageSelect}
        savedSession={savedSession}
        onContinueSession={handleContinueSession}
        onSignOut={signOut}
        isAuthenticated={!!user}
      />
    );
  }

  // Determine where to show save prompts
  const constellationMessageIndex = messages.findIndex(m => m.showConstellation);
  const lastAssistantWithActionPlan = actionPlan && !isStreaming
    ? messages.length - 1
    : -1;

  const showSidebar = !isMobile && started && constellationShown;

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        justifyContent: "center",
      }}
    >
    <div
      style={{
        maxWidth: 680,
        width: "100%",
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        boxSizing: "border-box",
      }}
    >
      {/* Header bar */}
      {messages.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <button
            onClick={handleReset}
            disabled={isStreaming}
            style={{
              background: "none",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "#666",
              cursor: isStreaming ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            ← Back to homepage
          </button>
          <button
            onClick={handleReset}
            disabled={isStreaming}
            style={{
              background: "none",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "#666",
              cursor: isStreaming ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            New chat
          </button>
        </div>
      )}

      {/* Stage badge */}
      {started && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <StageBadge stage={currentStage} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", textAlign: "center", marginTop: 60, fontSize: 14 }}>
            Start a conversation with Vamos Pathfinder
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  background: msg.role === "user" ? "#53D88B" : "#F5F5F5",
                  color: msg.role === "user" ? "#fff" : "#222",
                  padding: "12px 16px",
                  borderRadius: 12,
                  maxWidth: "85%",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    <ReactMarkdown>{stripShowConstellationTag(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>

            {msg.showConstellation && (
              <div ref={constellationRef} style={{ margin: "12px 0" }}>
                <IndustryConstellation onClusterClick={handleClusterClick} highlightClusterId={highlightClusterId} />
              </div>
            )}

            {/* Save prompt after constellation exploration */}
            {msg.showConstellation && showSaveAfterConstellation && !user && !isStreaming && exploredClusters.length > 0 && (
              <SaveProgressPrompt onSubmit={handleMagicLinkSubmit} isAuthenticated={!!user} />
            )}

            {/* Show action plan card after the last assistant message */}
            {msg.role === "assistant" && i === messages.length - 1 && actionPlan && !isStreaming && (
              <>
                <ActionPlanCard
                  plan={actionPlan}
                  isFirst={actionPlanCount <= 1}
                  connectedClusters={selectedClusterId ? getConnectedClusterNames(selectedClusterId) : []}
                  onExploreMore={() => constellationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                />

                {/* Save prompt after action plan */}
                {showSaveAfterActionPlan && !user && (
                  <SaveProgressPrompt onSubmit={handleMagicLinkSubmit} isAuthenticated={!!user} />
                )}
              </>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "#F5F5F5",
                color: "#888",
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, paddingTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about yourself, your degree, your interests..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isStreaming || !input.trim()}
          style={{
            background: isStreaming || !input.trim() ? "#a3e4bc" : "#53D88B",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: isStreaming || !input.trim() ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          Send
        </button>
      </div>

      <ProgressSavedToast show={showSavedToast} onDone={() => setShowSavedToast(false)} />
    </div>

      {showSidebar && (
        <ProgressSidebar
          exploredClusters={exploredClusters}
          currentStage={currentStage}
          actionPlan={actionPlan}
          isAuthenticated={!!user}
          onClusterNavigate={handleClusterNavigate}
        />
      )}
    </div>
  );
};

export default PathfinderChat;

