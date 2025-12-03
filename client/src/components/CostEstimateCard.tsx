import { Card, CardContent } from "@/components/ui/card";
import { Database, Zap, TrendingUp, AlertTriangle } from "lucide-react";

interface CostEstimateCardProps {
  bytesScanned: string;
  credits: number;
  optimizationScore: number;
  warnings?: string[];
}

export default function CostEstimateCard({
  bytesScanned,
  credits,
  optimizationScore,
  warnings = [],
}: CostEstimateCardProps) {
  const scoreColor =
    optimizationScore >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : optimizationScore >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <Card data-testid="cost-estimate-card">
      <CardContent className="p-4">
        <div className="mb-3 text-sm font-medium text-foreground">Cost Estimate</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Database className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Bytes Scanned</div>
              <div className="font-mono text-sm font-medium">{bytesScanned}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Credits</div>
              <div className="font-mono text-sm font-medium">{credits.toFixed(4)}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Optimization</div>
              <div className={`font-mono text-sm font-medium ${scoreColor}`}>
                {optimizationScore}%
              </div>
            </div>
          </div>
        </div>
        {warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="h-3 w-3" />
                {warning}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
