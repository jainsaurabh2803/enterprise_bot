import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lightbulb, ArrowRight, TrendingUp, BarChart3, Filter } from "lucide-react";

interface RecommendedStep {
  id: string;
  label: string;
  type: "drill-down" | "compare" | "filter" | "aggregate";
}

interface RecommendedStepsProps {
  steps: RecommendedStep[];
  onSelect: (step: RecommendedStep) => void;
}

const typeIcons = {
  "drill-down": TrendingUp,
  compare: BarChart3,
  filter: Filter,
  aggregate: BarChart3,
};

export default function RecommendedSteps({ steps, onSelect }: RecommendedStepsProps) {
  if (steps.length === 0) return null;

  return (
    <Card data-testid="recommended-steps">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">Recommended Next Steps</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const Icon = typeIcons[step.type];
          return (
            <button
              key={step.id}
              onClick={() => onSelect(step)}
              className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover-elevate"
              data-testid={`button-step-${step.id}`}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{step.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
