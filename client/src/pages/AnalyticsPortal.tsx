import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import ChatSidebar from "@/components/ChatSidebar";
import WorkflowPanel from "@/components/WorkflowPanel";
import ChatInput from "@/components/ChatInput";
import MessageBubble from "@/components/MessageBubble";
import QueryResponse from "@/components/QueryResponse";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  hasResponse: boolean;
  createdAt: string;
}

interface WorkflowStepData {
  id: string;
  conversationId: string;
  stepNumber: number;
  question: string;
  sql: string;
  status: "completed" | "current" | "pending";
  response: AgentResponse | null;
  createdAt: string;
}

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

interface QueryResponseData {
  conversationId: string;
  response: AgentResponse;
  workflowSteps: WorkflowStepData[];
  queryResults?: {
    columns: string[];
    data: Record<string, unknown>[];
  } | null;
}

interface SnowflakeSession {
  credentials: {
    account: string;
    username: string;
    warehouse: string;
    database: string;
    schema: string;
    role?: string;
  };
  connected: boolean;
}

export default function AnalyticsPortal() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState("analyst");
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [localWorkflowSteps, setLocalWorkflowSteps] = useState<WorkflowStepData[]>([]);
  const [currentResponse, setCurrentResponse] = useState<AgentResponse | null>(null);
  const [queryResults, setQueryResults] = useState<{ columns: string[]; data: Record<string, unknown>[] } | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<{ name: string; status: "idle" | "running" | "completed" | "error" }[]>([
    { name: "Intent Parser", status: "idle" },
    { name: "RAG Retrieval", status: "idle" },
    { name: "SQL Generator", status: "idle" },
    { name: "Validator", status: "idle" },
    { name: "Cost Optimizer", status: "idle" },
  ]);

  const { data: sessionData } = useQuery<{
    connected: boolean;
    session: SnowflakeSession | null;
    selectedTables: string[];
    hasSelectedTables: boolean;
  }>({
    queryKey: ["/api/snowflake/session"],
  });

  useEffect(() => {
    if (sessionData && !sessionData.connected) {
      setLocation("/");
    } else if (sessionData && sessionData.selectedTables) {
      setSelectedTables(sessionData.selectedTables);
    }
  }, [sessionData, setLocation]);

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch conversation details when active conversation changes
  const { data: conversationDetails } = useQuery<{
    conversation: Conversation;
    messages: Message[];
    workflowSteps: WorkflowStepData[];
  }>({
    queryKey: ["/api/conversations", activeConversationId],
    enabled: !!activeConversationId,
  });

  // Update local state when conversation details change
  useEffect(() => {
    if (conversationDetails) {
      setLocalMessages(conversationDetails.messages);
      setLocalWorkflowSteps(conversationDetails.workflowSteps);
      
      // Set current response from the most recent workflow step
      const currentStep = conversationDetails.workflowSteps.find(s => s.status === "current");
      if (currentStep?.response) {
        setCurrentResponse(currentStep.response);
      }
    }
  }, [conversationDetails]);

  // Query mutation
  const queryMutation = useMutation({
    mutationFn: async (data: { question: string; conversationId?: string; role: string }) => {
      const response = await apiRequest("POST", "/api/query", data);
      return response.json() as Promise<QueryResponseData>;
    },
    onSuccess: (data) => {
      setActiveConversationId(data.conversationId);
      setCurrentResponse(data.response);
      setLocalWorkflowSteps(data.workflowSteps);
      
      // Store query results if available
      if (data.queryResults) {
        setQueryResults(data.queryResults);
      }
      
      // Reset agent statuses
      setAgentStatuses(prev => prev.map(a => ({ ...a, status: "completed" as const })));
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", data.conversationId] });
    },
    onError: (error) => {
      console.error("Query error:", error);
      toast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
      setAgentStatuses(prev => prev.map(a => ({ ...a, status: "idle" as const })));
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "New Analysis",
        preview: "Start asking questions...",
      });
      return response.json() as Promise<Conversation>;
    },
    onSuccess: (data) => {
      setActiveConversationId(data.id);
      setLocalMessages([]);
      setLocalWorkflowSteps([]);
      setCurrentResponse(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Clear workflow mutation
  const clearWorkflowMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}/workflow`);
    },
    onSuccess: () => {
      setLocalWorkflowSteps([]);
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId] });
      }
    },
  });

  const handleSendMessage = (content: string) => {
    // Add optimistic user message
    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: activeConversationId || "",
      role: "user",
      content,
      hasResponse: false,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMessage]);

    // Simulate agent pipeline progress
    const agentOrder = ["Intent Parser", "RAG Retrieval", "SQL Generator", "Validator", "Cost Optimizer"];
    agentOrder.forEach((name, index) => {
      setTimeout(() => {
        setAgentStatuses(prev => 
          prev.map(a => 
            a.name === name 
              ? { ...a, status: "running" as const }
              : a.name === agentOrder[index - 1]
              ? { ...a, status: "completed" as const }
              : a
          )
        );
      }, index * 400);
    });

    // Send query to backend
    queryMutation.mutate({
      question: content,
      conversationId: activeConversationId || undefined,
      role,
    });
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setLocalWorkflowSteps([]);
    setCurrentResponse(null);
    setAgentStatuses(prev => prev.map(a => ({ ...a, status: "idle" as const })));
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setAgentStatuses(prev => prev.map(a => ({ ...a, status: "idle" as const })));
  };

  const handleSelectRecommendedStep = (step: { id: string; label: string; type: string }) => {
    handleSendMessage(step.label);
  };

  const handleExportWorkflow = () => {
    if (localWorkflowSteps.length === 0) return;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      steps: localWorkflowSteps.map(s => ({
        stepNumber: s.stepNumber,
        question: s.question,
        sql: s.sql,
        status: s.status,
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workflow Exported",
      description: "Your workflow has been downloaded as JSON.",
    });
  };

  const handleClearWorkflow = () => {
    if (activeConversationId) {
      clearWorkflowMutation.mutate(activeConversationId);
    }
  };

  // Format conversations for sidebar
  const formattedConversations = conversations.map(c => ({
    id: c.id,
    title: c.title,
    preview: c.preview,
    timestamp: formatRelativeTime(c.updatedAt),
  }));

  // Format workflow steps for panel
  const formattedWorkflowSteps = localWorkflowSteps.map(s => ({
    id: s.id,
    stepNumber: s.stepNumber,
    question: s.question,
    sqlSnippet: s.sql.length > 40 ? s.sql.substring(0, 37) + "..." : s.sql,
    timestamp: formatTime(s.createdAt),
    status: s.status,
  }));

  // Get recommended steps from current response
  const recommendedSteps = currentResponse?.recommended_next_steps.map((label, i) => ({
    id: String(i + 1),
    label,
    type: i === 0 ? "drill-down" : i === 1 ? "compare" : "filter",
  })) as { id: string; label: string; type: "drill-down" | "compare" | "filter" | "aggregate" }[] || [];

  // Parse access control from response
  const parseAccessControl = (response: AgentResponse | null) => {
    if (!response) {
      return {
        role: role.toUpperCase(),
        maskedColumns: [],
        restrictedTables: [],
        rowFilters: [],
      };
    }
    
    // Parse from access_control_applied string
    const maskedMatch = response.access_control_applied.match(/Masked: ([^.]+)/);
    const maskedColumns = maskedMatch ? maskedMatch[1].split(", ") : [];
    
    return {
      role: role.toUpperCase(),
      maskedColumns: role === "analyst" ? ["email", "phone_number"] : [],
      restrictedTables: role === "analyst" ? ["hr.salaries", "finance.expenses"] : [],
      rowFilters: role === "analyst" ? ["region IN ('NA', 'US', 'CA')"] : [],
    };
  };

  // Parse cost estimate from response
  const parseCostEstimate = (response: AgentResponse | null) => {
    if (!response) {
      return {
        bytesScanned: "0 KB",
        credits: 0,
        optimizationScore: 100,
        warnings: [],
      };
    }
    
    const bytesMatch = response.cost_estimate.match(/~?([0-9.]+\s*[A-Z]+)/);
    const creditsMatch = response.cost_estimate.match(/([0-9.]+)\s*credits/);
    
    return {
      bytesScanned: bytesMatch ? bytesMatch[1] : "2.4 GB",
      credits: creditsMatch ? parseFloat(creditsMatch[1]) : 0.0234,
      optimizationScore: response.validation_status === "PASS" ? 85 : 50,
      warnings: response.validation_status === "FAIL" ? [response.explainability_notes] : [],
    };
  };

  // Compute columns and data for display (use real results if available, otherwise show placeholder)
  const displayColumns = queryResults?.columns || [];
  const displayData = (queryResults?.data || []) as Record<string, string | number | null>[];

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        currentRole={role}
        onRoleChange={setRole}
        workflowPanelOpen={workflowPanelOpen}
        onToggleWorkflowPanel={() => setWorkflowPanelOpen(!workflowPanelOpen)}
        selectedTables={selectedTables}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          conversations={formattedConversations}
          activeId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {localMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <svg
                      className="h-12 w-12 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold">Start a New Analysis</h2>
                  <p className="mt-2 max-w-md text-muted-foreground">
                    Ask questions about your Snowflake data in natural language. I'll generate
                    secure, optimized SQL queries and provide actionable insights using Gemini AI.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "Show top customers by revenue",
                      "Analyze monthly sales trends",
                      "Compare regional performance",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSendMessage(suggestion)}
                        className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover-elevate"
                        data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                localMessages.map((message, index) => (
                  <div key={message.id} className="space-y-4">
                    <MessageBubble
                      role={message.role}
                      content={message.content}
                      timestamp={formatTime(message.createdAt)}
                    />
                    {message.role === "assistant" && currentResponse && index === localMessages.length - 1 && (
                      <QueryResponse
                        sql={currentResponse.generated_sql}
                        columns={displayColumns}
                        data={displayData}
                        costEstimate={parseCostEstimate(currentResponse)}
                        accessControl={parseAccessControl(currentResponse)}
                        recommendedSteps={recommendedSteps}
                        agents={agentStatuses}
                        onSelectStep={handleSelectRecommendedStep}
                        isLoading={queryMutation.isPending}
                      />
                    )}
                  </div>
                ))
              )}

              {queryMutation.isPending && localMessages[localMessages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <ChatInput onSend={handleSendMessage} disabled={queryMutation.isPending} />
        </main>

        {workflowPanelOpen && (
          <WorkflowPanel
            steps={formattedWorkflowSteps}
            onSelectStep={(id) => {
              const step = localWorkflowSteps.find(s => s.id === id);
              if (step?.response) {
                setCurrentResponse(step.response);
              }
            }}
            onExport={handleExportWorkflow}
            onClear={handleClearWorkflow}
          />
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
