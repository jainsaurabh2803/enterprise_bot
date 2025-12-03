import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import WorkflowStep from "./WorkflowStep";
import { GitBranch, Download, Trash2 } from "lucide-react";

interface WorkflowStepData {
  id: string;
  stepNumber: number;
  question: string;
  sqlSnippet: string;
  timestamp: string;
  status: "completed" | "current" | "pending";
}

interface WorkflowPanelProps {
  steps: WorkflowStepData[];
  onSelectStep: (id: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export default function WorkflowPanel({
  steps,
  onSelectStep,
  onExport,
  onClear,
}: WorkflowPanelProps) {
  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Workflow History</h2>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onExport}
            disabled={steps.length === 0}
            data-testid="button-export-workflow"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClear}
            disabled={steps.length === 0}
            data-testid="button-clear-workflow"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        {steps.length > 0 ? (
          <div className="relative space-y-3">
            {steps.map((step, i) => (
              <div key={step.id} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-[11px] top-[52px] h-[calc(100%-20px)] w-0.5 bg-border" />
                )}
                <WorkflowStep
                  stepNumber={step.stepNumber}
                  question={step.question}
                  sqlSnippet={step.sqlSnippet}
                  timestamp={step.timestamp}
                  status={step.status}
                  onClick={() => onSelectStep(step.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No workflow steps yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your analysis steps will appear here
            </p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
