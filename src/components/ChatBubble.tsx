import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

const ChatBubble = ({ message, isUser, timestamp }: ChatBubbleProps) => {
  return (
    <div className={cn("flex w-full animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground rounded-bl-md"
        )}
      >
        <p>{message}</p>
        <span className={cn(
          "block text-[10px] mt-1 opacity-60",
          isUser ? "text-primary-foreground text-right" : "text-muted-foreground"
        )}>
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;

