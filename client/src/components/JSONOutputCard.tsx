import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface AgentResponse {
  intent_summary: string;
  retrieved_context: string;
  generated_sql: string;
  access_control_applied: string;
  cost_estimate: string;
  validation_status: "PASS" | "FAIL";
  explainability_notes: string;
  result_preview: string;
  workflow_step_saved: boolean;
  recommended_next_steps: string[];
  reporting_ready: boolean;
}

interface JSONOutputCardProps {
  response: AgentResponse;
}

export default function JSONOutputCard({ response }: JSONOutputCardProps) {
  const [expanded, setExpanded] = useState(false);

  const mainFields = [
    { key: "intent_summary", label: "Intent Summary" },
    { key: "validation_status", label: "Validation Status" },
    { key: "cost_estimate", label: "Cost Estimate" },
  ];

  const expandedFields = [
    { key: "retrieved_context", label: "Retrieved Context" },
    { key: "access_control_applied", label: "Access Control" },
    { key: "explainability_notes", label: "Explainability Notes" },
    { key: "result_preview", label: "Result Preview" },
  ];

  return (
    <Card data-testid="json-output-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <span className="text-sm font-medium">Agent Response</span>
        <div className="flex items-center gap-2">
          {response.workflow_step_saved && (
            <StatusBadge status="success" label="Step Saved" />
          )}
          {response.reporting_ready && (
            <StatusBadge status="info" label="Report Ready" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          {mainFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {field.label}
              </span>
              {field.key === "validation_status" ? (
                <StatusBadge
                  status={response.validation_status === "PASS" ? "success" : "error"}
                  label={response.validation_status}
                />
              ) : (
                <span className="text-sm">
                  {response[field.key as keyof AgentResponse] as string}
                </span>
              )}
            </div>
          ))}
        </div>

        {expanded && (
          <div className="grid gap-3 border-t border-border pt-3">
            {expandedFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {response[field.key as keyof AgentResponse] as string}
                </span>
              </div>
            ))}
            {response.recommended_next_steps.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Recommended Next Steps
                </span>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {response.recommended_next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full gap-1"
          data-testid="button-toggle-details"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More Details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
