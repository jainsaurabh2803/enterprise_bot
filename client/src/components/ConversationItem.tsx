import { MessageSquare } from "lucide-react";

interface ConversationItemProps {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  isActive?: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  title,
  preview,
  timestamp,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md p-3 text-left transition-colors hover-elevate ${
        isActive ? "bg-sidebar-accent" : ""
      }`}
      data-testid={`conversation-item-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded bg-primary/10 p-1.5">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
        </div>
      </div>
    </button>
  );
}
