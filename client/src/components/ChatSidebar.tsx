import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ConversationItem from "./ConversationItem";
import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="flex h-full w-80 flex-col border-r border-border bg-sidebar">
      <div className="flex flex-col gap-3 p-4">
        <Button
          onClick={onNewConversation}
          className="w-full gap-2"
          data-testid="button-new-conversation"
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-conversations"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                id={conversation.id}
                title={conversation.title}
                preview={conversation.preview}
                timestamp={conversation.timestamp}
                isActive={conversation.id === activeId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
