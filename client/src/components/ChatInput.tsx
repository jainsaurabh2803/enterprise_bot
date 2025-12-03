import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask a question about your data...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4" data-testid="chat-input">
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            data-testid="button-attach"
            onClick={() => console.log("Attach file clicked")}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            data-testid="button-voice"
            onClick={() => console.log("Voice input clicked")}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[150px] resize-none"
          rows={1}
          data-testid="input-message"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Press <kbd className="rounded bg-muted px-1 py-0.5 font-mono">Cmd</kbd> +{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono">Enter</kbd> to send
      </div>
    </div>
  );
}
