import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import { FileText, ArrowRight } from "lucide-react";

interface WorkflowStepProps {
  stepNumber: number;
  question: string;
  sqlSnippet: string;
  timestamp: string;
  status: "completed" | "current" | "pending";
  onClick: () => void;
}

export default function WorkflowStep({
  stepNumber,
  question,
  sqlSnippet,
  timestamp,
  status,
  onClick,
}: WorkflowStepProps) {
  return (
    <Card
      className={`cursor-pointer hover-elevate ${
        status === "current" ? "border-primary" : ""
      }`}
      onClick={onClick}
      data-testid={`workflow-step-${stepNumber}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                status === "current"
                  ? "bg-primary text-primary-foreground"
                  : status === "completed"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber}
            </div>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          {status === "completed" && <StatusBadge status="success" label="Done" />}
          {status === "current" && <StatusBadge status="info" label="Active" />}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium">{question}</p>
        <div className="mt-2 flex items-center gap-2 rounded bg-muted/50 px-2 py-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <code className="truncate text-xs text-muted-foreground">{sqlSnippet}</code>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
          <span>Load this step</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
}
