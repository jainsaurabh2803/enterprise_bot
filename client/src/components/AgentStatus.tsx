import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface Agent {
  name: string;
  status: "idle" | "running" | "completed" | "error";
}

interface AgentStatusProps {
  agents: Agent[];
}

const statusIcons = {
  idle: null,
  running: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
  completed: <Check className="h-3 w-3 text-emerald-600" />,
  error: <AlertCircle className="h-3 w-3 text-destructive" />,
};

const statusColors = {
  idle: "bg-muted",
  running: "bg-primary/20",
  completed: "bg-emerald-500/20",
  error: "bg-destructive/20",
};

export default function AgentStatus({ agents }: AgentStatusProps) {
  return (
    <Card data-testid="agent-status">
      <CardContent className="p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          MCP Agent Pipeline
        </div>
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                statusColors[agent.status]
              }`}
              data-testid={`agent-${agent.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {statusIcons[agent.status]}
              <span className="font-medium">{agent.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
