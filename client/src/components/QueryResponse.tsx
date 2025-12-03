import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SQLCodeBlock from "./SQLCodeBlock";
import ResultsTable from "./ResultsTable";
import CostEstimateCard from "./CostEstimateCard";
import AccessControlInfo from "./AccessControlInfo";
import RecommendedSteps from "./RecommendedSteps";
import AgentStatus from "./AgentStatus";
import { FileText, Table, Shield, Lightbulb } from "lucide-react";

interface QueryResponseProps {
  sql: string;
  columns: string[];
  data: Record<string, string | number | null>[];
  costEstimate: {
    bytesScanned: string;
    credits: number;
    optimizationScore: number;
    warnings: string[];
  };
  accessControl: {
    role: string;
    maskedColumns: string[];
    restrictedTables: string[];
    rowFilters: string[];
  };
  recommendedSteps: { id: string; label: string; type: "drill-down" | "compare" | "filter" | "aggregate" }[];
  agents: { name: string; status: "idle" | "running" | "completed" | "error" }[];
  onSelectStep: (step: { id: string; label: string; type: string }) => void;
  isLoading?: boolean;
}

export default function QueryResponse({
  sql,
  columns,
  data,
  costEstimate,
  accessControl,
  recommendedSteps,
  agents,
  onSelectStep,
  isLoading = false,
}: QueryResponseProps) {
  return (
    <div className="space-y-4" data-testid="query-response">
      <AgentStatus agents={agents} />

      <Tabs defaultValue="query" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query" className="gap-1.5" data-testid="tab-query">
            <FileText className="h-4 w-4" />
            Query
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5" data-testid="tab-results">
            <Table className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5" data-testid="tab-security">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="next" className="gap-1.5" data-testid="tab-next">
            <Lightbulb className="h-4 w-4" />
            Next Steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="mt-4 space-y-4">
          <SQLCodeBlock sql={sql} />
          <CostEstimateCard {...costEstimate} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center rounded-md border border-border bg-muted/30">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                <p className="text-sm text-muted-foreground">Executing query...</p>
              </div>
            </div>
          ) : (
            <ResultsTable columns={columns} data={data} />
          )}
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <AccessControlInfo {...accessControl} />
        </TabsContent>

        <TabsContent value="next" className="mt-4">
          <RecommendedSteps steps={recommendedSteps} onSelect={onSelectStep} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
