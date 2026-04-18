import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ActionPlan } from "@/components/ActionPlanCard";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  showConstellation?: boolean;
}

interface ProgressData {
  conversation_id: string | null;
  explored_clusters: string[];
  conversation_history: ChatMessage[];
  action_plan: ActionPlan | null;
  current_stage: string;
  stage_context: string | null;
  selected_cluster_id: string | null;
}

export interface SavedProgress {
  id: string;
  conversation_id: string | null;
  explored_clusters: string[];
  conversation_history: ChatMessage[];
  action_plan: ActionPlan | null;
  current_stage: string;
  stage_context: string | null;
  selected_cluster_id: string | null;
  updated_at: string;
}

export function useProgressSave(user: User | null) {
  const saveProgress = useCallback(
    async (data: ProgressData) => {
      if (!user) return;

      const payload = {
        user_id: user.id,
        conversation_id: data.conversation_id,
        explored_clusters: data.explored_clusters,
        conversation_history: data.conversation_history as any,
        action_plan: data.action_plan as any,
        current_stage: data.current_stage,
        stage_context: data.stage_context,
        selected_cluster_id: data.selected_cluster_id,
      };

      const { error } = await supabase
        .from("user_progress")
        .upsert(payload, { onConflict: "user_id" });

      if (error) console.error("Failed to save progress:", error);
      return !error;
    },
    [user]
  );

  const loadProgress = useCallback(async (): Promise<SavedProgress | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load progress:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      conversation_id: data.conversation_id ?? null,
      explored_clusters: data.explored_clusters ?? [],
      conversation_history: (data.conversation_history as any) ?? [],
      action_plan: (data.action_plan as any) ?? null,
      current_stage: data.current_stage ?? "Explore",
      stage_context: data.stage_context ?? null,
      selected_cluster_id: data.selected_cluster_id ?? null,
      updated_at: data.updated_at,
    };
  }, [user]);

  return { saveProgress, loadProgress };
}

