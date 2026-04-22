import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation, useNavigate } from "react-router-dom";
import IndustryConstellation from "./IndustryConstellation";
import WelcomeScreen from "./WelcomeScreen";
import StageBadge, { type Stage } from "./StageBadge";
import ActionPlanCard, { type ActionPlan } from "./ActionPlanCard";
import RoadmapCard, { type Roadmap } from "./RoadmapCard";
import SaveProgressPrompt from "./SaveProgressPrompt";
import ProgressSavedToast from "./ProgressSavedToast";
import ProgressSidebar from "./ProgressSidebar";
import JourneyRoadmap from "./JourneyRoadmap";
import { getConnectedClusterNames } from "@/data/constellationData";
import { useAuth } from "@/hooks/useAuth";
import { useProgressSave, type SavedProgress } from "@/hooks/useProgressSave";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseEnv";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "action_plan";
  showConstellation?: boolean;
  roadmaps?: Roadmap[];
  actionPlan?: ActionPlan;
}

const STAGE_REGEX = /^\[STAGE:(Explore|Plan|Build|Reflect)\]\s*/;
/**
 * Extract [ACTION_PLAN: {...}] tags with brace matching (non-greedy regex breaks on nested JSON).
 */
function forEachActionPlanTag(
  text: string,
  onTag: (payload: { jsonStr: string; start: number; end: number }) => void
) {
  const marker = "[ACTION_PLAN:";
  let search = 0;
  while (search < text.length) {
    const i = text.indexOf(marker, search);
    if (i === -1) break;
    let p = i + marker.length;
    while (p < text.length && /\s/.test(text[p])) p++;
    if (p >= text.length || text[p] !== "{") {
      search = i + marker.length;
      continue;
    }
    const jsonStart = p;
    let depth = 0;
    let q = jsonStart;
    for (; q < text.length; q++) {
      const c = text[q];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          q++;
          break;
        }
      }
    }
    if (depth !== 0) {
      search = i + 1;
      continue;
    }
    const jsonStr = text.slice(jsonStart, q);
    let end = q;
    while (end < text.length && /\s/.test(text[end])) end++;
    if (text[end] === "]") end++;
    onTag({ jsonStr, start: i, end });
    search = end;
  }
}

function stripActionPlanTags(text: string): string {
  const spans: { start: number; end: number }[] = [];
  forEachActionPlanTag(text, ({ start, end }) => spans.push({ start, end }));
  let out = text;
  for (let k = spans.length - 1; k >= 0; k--) {
    const { start, end } = spans[k];
    out = out.slice(0, start) + out.slice(end);
  }
  return out.trim();
}

function forEachShowRoadmapTag(
  text: string,
  onTag: (payload: { jsonStr: string; start: number; end: number }) => void
) {
  const marker = "[SHOW_ROADMAP:";
  let search = 0;
  while (search < text.length) {
    const i = text.indexOf(marker, search);
    if (i === -1) break;
    let p = i + marker.length;
    while (p < text.length && /\s/.test(text[p])) p++;
    if (p >= text.length || text[p] !== "{") {
      search = i + marker.length;
      continue;
    }
    const jsonStart = p;
    let depth = 0;
    let q = jsonStart;
    for (; q < text.length; q++) {
      const c = text[q];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          q++;
          break;
        }
      }
    }
    if (depth !== 0) {
      search = i + 1;
      continue;
    }
    const jsonStr = text.slice(jsonStart, q);
    let end = q;
    while (end < text.length && /\s/.test(text[end])) end++;
    if (text[end] === "]") end++;
    onTag({ jsonStr, start: i, end });
    search = end;
  }
}

function stripShowRoadmapTags(text: string): string {
  const spans: { start: number; end: number }[] = [];
  forEachShowRoadmapTag(text, ({ start, end }) => spans.push({ start, end }));
  let out = text;
  for (let k = spans.length - 1; k >= 0; k--) {
    const { start, end } = spans[k];
    out = out.slice(0, start) + out.slice(end);
  }
  return out.trim();
}

/**
 * Replace complete [SHOW_ROADMAP: {...}] with [[ROADMAP:n]]; if the first tag is incomplete (streaming), drop from its opening bracket onward.
 */
function replaceShowRoadmapTagsWithPlaceholders(text: string): { text: string; roadmaps: Roadmap[] } {
  const roadmaps: Roadmap[] = [];
  const marker = "[SHOW_ROADMAP:";
  let out = "";
  let cursor = 0;
  while (cursor < text.length) {
    const i = text.indexOf(marker, cursor);
    if (i === -1) {
      out += text.slice(cursor);
      break;
    }
    out += text.slice(cursor, i);
    let p = i + marker.length;
    while (p < text.length && /\s/.test(text[p])) p++;
    if (p >= text.length || text[p] !== "{") {
      cursor = i + marker.length;
      continue;
    }
    const jsonStart = p;
    let depth = 0;
    let q = jsonStart;
    for (; q < text.length; q++) {
      const c = text[q];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          q++;
          break;
        }
      }
    }
    if (depth !== 0) {
      return { text: out.trimEnd(), roadmaps };
    }
    const jsonStr = text.slice(jsonStart, q);
    let end = q;
    while (end < text.length && /\s/.test(text[end])) end++;
    if (text[end] !== "]") {
      return { text: out.trimEnd(), roadmaps };
    }
    end++;
    try {
      roadmaps.push(JSON.parse(jsonStr) as Roadmap);
      out += `[[ROADMAP:${roadmaps.length - 1}]]`;
      cursor = end;
    } catch {
      return { text: out.trimEnd(), roadmaps };
    }
  }
  return { text: out.trim(), roadmaps };
}

/** Hide any trailing incomplete structured tag while the model is still streaming. */
function stripPartialOpenTag(text: string, marker: string): string {
  const i = text.indexOf(marker);
  if (i === -1) return text;
  return text.slice(0, i).trimEnd();
}

function sanitizeAssistantMessageText(text: string): string {
  let t = stripShowConstellationTag(text);
  t = t.replace(/^\[STAGE:(?:Explore|Plan|Build|Reflect)\]\s*/m, "");
  t = stripActionPlanTags(t);
  t = stripShowRoadmapTags(t);
  if (t.includes("[ACTION_PLAN:")) t = stripPartialOpenTag(t, "[ACTION_PLAN:");
  if (t.includes("[SHOW_ROADMAP:")) t = stripPartialOpenTag(t, "[SHOW_ROADMAP:");
  return t;
}

/** Strip from UI always; constellation UI only toggles on first trigger in this session. */
const SHOW_CONSTELLATION_RE = /\[SHOW_CONSTELLATION\]\s*/g;
const ROADMAP_PLACEHOLDER_RE = /\[\[ROADMAP:(\d+)\]\]/g;

function stripShowConstellationTag(text: string): string {
  return text.replace(SHOW_CONSTELLATION_RE, "").trim();
}

function renderAssistantContent(msg: ChatMessage) {
  const raw = sanitizeAssistantMessageText(msg.content);
  const roadmaps = msg.roadmaps ?? [];

  if (roadmaps.length === 0 || !ROADMAP_PLACEHOLDER_RE.test(raw)) {
    // Reset regex state because we use /g above
    ROADMAP_PLACEHOLDER_RE.lastIndex = 0;
    return <ReactMarkdown>{raw}</ReactMarkdown>;
  }

  ROADMAP_PLACEHOLDER_RE.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(ROADMAP_PLACEHOLDER_RE)) {
    const idx = Number(match[1]);
    const start = match.index ?? 0;
    const before = raw.slice(lastIndex, start);
    if (before.trim()) {
      parts.push(<ReactMarkdown key={`md-${parts.length}`}>{before}</ReactMarkdown>);
    } else if (before.length > 0) {
      parts.push(<ReactMarkdown key={`md-${parts.length}`}>{before}</ReactMarkdown>);
    }
    if (roadmaps[idx]) {
      parts.push(<RoadmapCard key={`rm-${idx}`} roadmap={roadmaps[idx]} />);
    }
    lastIndex = start + match[0].length;
  }
  const tail = raw.slice(lastIndex);
  if (tail.trim() || tail.length > 0) {
    parts.push(<ReactMarkdown key={`md-${parts.length}`}>{tail}</ReactMarkdown>);
  }
  return <>{parts}</>;
}

function stageToUrlSlug(stage: Stage): string {
  const map: Record<Stage, string> = {
    Explore: "explore",
    Plan: "plan",
    Build: "build",
    Reflect: "reflect",
  };
  return map[stage] ?? "explore";
}

const PathfinderChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  /** Server-backed session id; explored clusters belong to this conversation only. */
  const [conversationId, setConversationId] = useState<string | null>(null);
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
  /** Stage the student chose when starting this session (URL or saved progress); used to ignore early [STAGE:Plan] noise on Build/Reflect (first two assistant replies only). */
  const sessionEntryStageRef = useRef<Stage | null>(null);
  /** True only for Explore journeys; passed to the chat API so non-Explore stages never get constellation UX. */
  const constellationEligibleRef = useRef(false);
  /**
   * Once the first [ACTION_PLAN: {...}] is successfully applied in this chat, ignore any later tags in the same
   * conversation (state is only set once). Reset when starting a new chat or when loading a saved session.
   */
  const actionPlanConsumedForSessionRef = useRef(false);

  /** Any time an action plan exists in state, treat the session as having consumed the first tag (guards against ref/parse edge cases). */
  useEffect(() => {
    if (actionPlan != null) {
      actionPlanConsumedForSessionRef.current = true;
    }
  }, [actionPlan]);

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
      conversation_id: conversationId,
      explored_clusters: exploredClusters,
      conversation_history: messages,
      action_plan: actionPlan,
      current_stage: currentStage,
      stage_context: stageContext,
      selected_cluster_id: selectedClusterId,
    });
    if (saved) setShowSavedToast(true);
  }, [user, saveProgress, conversationId, exploredClusters, messages, actionPlan, currentStage, stageContext, selectedClusterId]);

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

  const sendMessages = useCallback(
    async (
      allMessages: ChatMessage[],
      ctxOverride?: string,
      opts?: { exploredClustersCount?: number }
    ) => {
    setIsStreaming(true);

    /** 1-based index of this assistant reply (opening message = 1). Used to ignore spurious [STAGE:Plan] early in Build/Reflect. */
    const assistantTurnNumber =
      allMessages.filter((m) => m.role === "assistant").length + 1;
    /** Index of the streaming assistant text message in `messages` state. */
    let streamingMsgIndex = -1;

    const apiMessages = allMessages.map(({ role, content }) => ({ role, content }));
    const ctx = ctxOverride ?? stageContext;
    const exploredCount = opts?.exploredClustersCount ?? exploredClusters.length;

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
          exploredClustersCount: exploredCount,
          actionPlanOffered,
          constellationEligible: constellationEligibleRef.current,
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

      setMessages((prev) => {
        streamingMsgIndex = prev.length;
        return [...prev, { role: "assistant", type: "text", content: "" }];
      });

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
                const incoming = stageMatch[1] as Stage;
                const entry = sessionEntryStageRef.current;
                const ignoreEarlyPlanInBuildOrReflect =
                  incoming === "Plan" &&
                  (entry === "Build" || entry === "Reflect") &&
                  assistantTurnNumber <= 2;
                if (!ignoreEarlyPlanInBuildOrReflect) {
                  setCurrentStage(incoming);
                }
                display = display.replace(STAGE_REGEX, "");
              }

              if (!constellationEligibleRef.current) {
                display = display.replace(SHOW_CONSTELLATION_RE, "").trim();
              }

              {
                const beforeConstellationStrip = display;
                display = display.replace(SHOW_CONSTELLATION_RE, "").trim();
                if (beforeConstellationStrip !== display) {
                  showConst = true;
                  setConstellationShown(true);
                }
              }

              // Roadmap tags: brace-balanced JSON, placeholders for cards; incomplete tags hidden
              const rm = replaceShowRoadmapTagsWithPlaceholders(display);
              display = rm.text;
              const roadmaps: Roadmap[] | undefined =
                rm.roadmaps.length > 0 ? rm.roadmaps : undefined;

              const actionPlanPayloads: { jsonStr: string }[] = [];
              forEachActionPlanTag(display, ({ jsonStr }) => actionPlanPayloads.push({ jsonStr }));
              if (actionPlanPayloads.length > 0) {
                // First successful parse only; later tags are stripped from UI and ignored when already consumed.
                if (!actionPlanConsumedForSessionRef.current) {
                  try {
                    const last = actionPlanPayloads[actionPlanPayloads.length - 1];
                    const rawParsed = JSON.parse(last.jsonStr) as any;
                    const normalized: ActionPlan =
                      rawParsed && Array.isArray(rawParsed.steps)
                        ? {
                            role: rawParsed.title ?? "Your Action Plan",
                            keepExploring: [],
                            startBuilding: [],
                            stepsDetailed: rawParsed.steps,
                            careersPrompt: "",
                          }
                        : (rawParsed as ActionPlan);
                    // Mark consumed immediately (state updaters are async; do not rely on local flags set inside them).
                    actionPlanConsumedForSessionRef.current = true;
                    setActionPlan((prev) => (prev != null ? prev : normalized));
                    setActionPlanCount((prev) => prev + 1);
                    setActionPlanOffered(true);

                    // Inject an inline action plan message item immediately after the streaming assistant text message.
                    setMessages((prev) => {
                      if (prev.some((m) => m.type === "action_plan")) return prev;
                      const next = [...prev];
                      const idx = streamingMsgIndex >= 0 ? streamingMsgIndex : next.length - 1;
                      const injected = {
                        role: "assistant" as const,
                        type: "action_plan" as const,
                        content: "",
                        actionPlan: normalized,
                      };
                      console.log("[PathfinderChat] injected action_plan message", { idx: idx + 1 });
                      next.splice(idx + 1, 0, injected);
                      return next;
                    });
                  } catch {
                    /* JSON incomplete until more deltas arrive */
                  }
                }
              }
              display = stripActionPlanTags(display);
              if (display.includes("[ACTION_PLAN:")) {
                display = stripPartialOpenTag(display, "[ACTION_PLAN:");
              }
              if (display.includes("[SHOW_ROADMAP:")) {
                display = stripPartialOpenTag(display, "[SHOW_ROADMAP:");
              }

              setMessages((prev) => {
                const updated = [...prev];
                const idx = streamingMsgIndex >= 0 ? streamingMsgIndex : updated.length - 1;
                const prevMsg = updated[idx];
                updated[idx] = {
                  role: "assistant",
                  type: "text",
                  content: display,
                  showConstellation: showConst || prevMsg?.showConstellation === true,
                  roadmaps,
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
  },
    [stageContext, exploredClusters, actionPlanOffered]
  );

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
      const willAdd = !exploredClusters.includes(clusterId);
      const exploredCountForApi = willAdd ? exploredClusters.length + 1 : exploredClusters.length;
      setExploredClusters((prev) => (prev.includes(clusterId) ? prev : [...prev, clusterId]));
      const msg = `I'm curious about ${title}. Tell me more about what that looks like for someone with my background.`;
      setInput("");
      const userMessage: ChatMessage = { role: "user", content: msg };
      setMessages((prev) => {
        const next = [...prev, userMessage];
        sendMessages(next, undefined, { exploredClustersCount: exploredCountForApi });
        return next;
      });
    },
    [sendMessages, exploredClusters]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStageSelect = useCallback(
    (stageId: string, _stageTitle: string) => {
      const planCtx =
        `The student is in the Plan stage. They have some direction and need both a roadmap and practical experience-building guidance. Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "OK so you've got some direction, that's more than most people give themselves credit for. Tell me what you're thinking and where you are in your degree, and I'll help you figure out what to actually do next and what experiences to start building."`;
      const buildCtx =
        `The student is in the Build stage. They know the job or field they're working toward and want guidance on experiences, skills, and opportunities to become a strong candidate. Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "Let's tighten up your path from here. What role or field are you aiming for, and what have you done so far toward it? I'll help you figure out which experiences and skills to prioritize next."`;
      const stagePrompts: Record<string, { ctx: string; badge: Stage }> = {
        explore: {
          ctx: `The student is in the Explore stage. They resonated with: "I don't really know what I want to do with my life". Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "Hey! So you're figuring things out, and that's a great place to start. Most people who end up in interesting careers didn't have a plan at your stage, they had curiosity. Let's start there. What are you studying, and what kinds of things do you actually enjoy doing, in or outside of uni?"`,
          badge: "Explore",
        },
        plan: { ctx: planCtx, badge: "Plan" },
        planbuild: { ctx: planCtx, badge: "Plan" },
        build: { ctx: buildCtx, badge: "Build" },
        reflect: {
          ctx: `The student is in the Reflect stage. They resonated with: "I've done stuff but I still feel lost". Do not mention that they selected a stage. Start the conversation with EXACTLY this message (do not change the wording): "Sometimes the best way forward is to look back at what you've already done. Tell me about the experiences you've had so far, work, uni, volunteering, whatever, and what stood out to you. Good or bad, both are useful."`,
          badge: "Reflect",
        },
      };
      const resolved =
        stagePrompts[stageId] ?? stagePrompts.explore;
      const ctx = resolved.ctx;
      const badgeStage = resolved.badge;
      sessionEntryStageRef.current = badgeStage;
      constellationEligibleRef.current = stageId === "explore";
      const newConversationId = crypto.randomUUID();
      setConversationId(newConversationId);
      setStageContext(ctx);
      setStarted(true);
      setMessages([]);
      setExploredClusters([]);
      setActionPlan(null);
      setActionPlanCount(0);
      actionPlanConsumedForSessionRef.current = false;
      setConstellationShown(false);
      setShowSaveAfterConstellation(false);
      setShowSaveAfterActionPlan(false);
      setCurrentStage(badgeStage);
      setActionPlanOffered(false);

      const startChat = async () => {
        if (user) {
          const ok = await saveProgress({
            conversation_id: newConversationId,
            explored_clusters: [],
            conversation_history: [],
            action_plan: null,
            current_stage: badgeStage,
            stage_context: ctx,
            selected_cluster_id: null,
          });
          if (ok) {
            const fresh = await loadProgress();
            if (fresh) {
              setSavedProgressData(fresh);
              if (fresh.conversation_history.length > 0) {
                setSavedSession({
                  clustersExplored: fresh.explored_clusters.length,
                  hasActionPlan: !!fresh.action_plan,
                  lastUpdated: fresh.updated_at,
                });
              } else {
                setSavedSession(null);
              }
            }
          }
        }
        sendMessages([], ctx, { exploredClustersCount: 0 });
      };

      void startChat();
      navigate(`/pathfinder?stage=${encodeURIComponent(stageId)}`, { replace: true });
    },
    [sendMessages, user, saveProgress, loadProgress, navigate]
  );

  // Deep link: /pathfinder?stage=explore|plan|planbuild|build|reflect
  // Starts the chosen flow once, then falls back to normal UI behavior.
  useEffect(() => {
    if (autoStartRef.current) return;
    if (started) return;
    if (authLoading) return;

    const stage = new URLSearchParams(location.search).get("stage");
    if (!stage) return;

    const stageId = stage.toLowerCase();
    const allowed = new Set(["explore", "plan", "planbuild", "build", "reflect"]);
    if (!allowed.has(stageId)) return;

    autoStartRef.current = true;
    handleStageSelect(stageId, "");
  }, [location.search, started, authLoading, handleStageSelect]);

  const handleContinueSession = useCallback(() => {
    if (!savedProgressData) return;
    setStarted(true);
    setConversationId(
      savedProgressData.conversation_id ?? crypto.randomUUID()
    );
    setMessages(savedProgressData.conversation_history);
    setExploredClusters(savedProgressData.explored_clusters);
    setActionPlan(savedProgressData.action_plan);
    setCurrentStage(savedProgressData.current_stage as Stage);
    setStageContext(savedProgressData.stage_context);
    setSelectedClusterId(savedProgressData.selected_cluster_id);
    setConstellationShown(savedProgressData.conversation_history.some(m => m.showConstellation));
    setActionPlanCount(savedProgressData.action_plan ? 1 : 0);
    actionPlanConsumedForSessionRef.current = !!savedProgressData.action_plan;
    sessionEntryStageRef.current = savedProgressData.current_stage as Stage;
    constellationEligibleRef.current = savedProgressData.current_stage === "Explore";
    navigate(
      `/pathfinder?stage=${encodeURIComponent(stageToUrlSlug(savedProgressData.current_stage as Stage))}`,
      { replace: true }
    );
  }, [savedProgressData, navigate]);

  const handleMagicLinkSubmit = useCallback(async (email: string) => {
    return signInWithMagicLink(email);
  }, [signInWithMagicLink]);

  const handleClusterNavigate = useCallback((clusterId: string) => {
    setHighlightClusterId(clusterId);
    constellationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightClusterId(null), 4500);
  }, []);

  const handleReset = useCallback(() => {
    autoStartRef.current = false;
    setMessages([]);
    setConstellationShown(false);
    setInput("");
    setStageContext(null);
    setStarted(false);
    setCurrentStage("Explore");
    setConversationId(null);
    setExploredClusters([]);
    setActionPlan(null);
    setActionPlanCount(0);
    actionPlanConsumedForSessionRef.current = false;
    setShowSaveAfterConstellation(false);
    setShowSaveAfterActionPlan(false);
    setHighlightClusterId(null);
    setActionPlanOffered(false);
    sessionEntryStageRef.current = null;
    navigate("/pathfinder", { replace: true });
  }, [navigate]);

  // Keep ?stage= in sync with the badge when the model updates [STAGE:...] or when continuing a session.
  useEffect(() => {
    if (!started) return;
    const expected = stageToUrlSlug(currentStage).toLowerCase();
    const cur = new URLSearchParams(location.search).get("stage")?.toLowerCase() ?? "";
    if (cur !== expected) {
      navigate(`/pathfinder?stage=${encodeURIComponent(expected)}`, { replace: true });
    }
  }, [started, currentStage, location.search, navigate]);

  // /pathfinder/welcome is a stable alias for the stage selector; normalize to /pathfinder and reset session state.
  useLayoutEffect(() => {
    const p = location.pathname.replace(/\/$/, "") || "/";
    if (p === "/pathfinder/welcome") {
      handleReset();
    }
  }, [location.pathname, handleReset]);

  if (!started) {
    return (
      <WelcomeScreen
        savedSession={savedSession}
        onContinueSession={handleContinueSession}
        onSignOut={signOut}
        isAuthenticated={!!user}
      />
    );
  }

  const showSidebar = !isMobile && started && constellationShown;
  const showJourneyRoadmap = !isMobile && started;
  const roadmapShown = messages.some((m) => (m.roadmaps?.length ?? 0) > 0);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        width: "100%",
        minHeight: 0,
        justifyContent: "center",
        alignItems: "stretch",
        overflow: "hidden",
      }}
    >
      {showJourneyRoadmap && (
        <JourneyRoadmap
          constellationShown={constellationShown}
          actionPlan={actionPlan}
          roadmapShown={roadmapShown}
        />
      )}
    <div
      style={{
        maxWidth: 680,
        width: "100%",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
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

      {/* Single scroll feed: messages, then action plan card inline, then input fixed below */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", textAlign: "center", marginTop: 60, fontSize: 14 }}>
            Start a conversation with Vamos Pathfinder
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === "action_plan" ? (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ maxWidth: "85%", width: "100%" }}>
                  {msg.actionPlan && (
                    <ActionPlanCard
                      plan={msg.actionPlan}
                      isFirst={actionPlanCount <= 1}
                      connectedClusters={selectedClusterId ? getConnectedClusterNames(selectedClusterId) : []}
                      onExploreMore={
                        constellationShown
                          ? () => constellationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                          : undefined
                      }
                    />
                  )}
                  {showSaveAfterActionPlan && !user && !isStreaming && (
                    <SaveProgressPrompt onSubmit={handleMagicLinkSubmit} isAuthenticated={!!user} />
                  )}
                </div>
              </div>
            ) : (
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
                      {renderAssistantContent(msg)}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            )}

            {msg.showConstellation && (
              <div ref={constellationRef} style={{ margin: "12px 0" }}>
                <IndustryConstellation onClusterClick={handleClusterClick} highlightClusterId={highlightClusterId} />
              </div>
            )}

            {msg.showConstellation && showSaveAfterConstellation && !user && !isStreaming && exploredClusters.length > 0 && (
              <SaveProgressPrompt onSubmit={handleMagicLinkSubmit} isAuthenticated={!!user} />
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

        {/* Action plan now renders inline as its own message item (see messages.map). */}
      </div>

      {/* Input — always at bottom of column; flexShrink 0 keeps it out of the scroll/middle flex fight */}
      <div
        style={{
          display: "flex",
          gap: 8,
          paddingTop: 12,
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
          backgroundColor: "hsl(var(--background))",
        }}
      >
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

