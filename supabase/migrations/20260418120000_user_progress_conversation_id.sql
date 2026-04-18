-- Scope Pathfinder progress (including explored_clusters) to a single active conversation per user.
alter table public.user_progress
  add column if not exists conversation_id text;

comment on column public.user_progress.conversation_id is 'Client-generated id for the current Pathfinder chat session; explored_clusters apply only to this conversation.';
