import { useState } from "react";
import Header from "@/components/Header";
import ChatSidebar from "@/components/ChatSidebar";
import WorkflowPanel from "@/components/WorkflowPanel";
import ChatInput from "@/components/ChatInput";
import MessageBubble from "@/components/MessageBubble";
import QueryResponse from "@/components/QueryResponse";
import { ScrollArea } from "@/components/ui/scroll-area";

// todo: remove mock functionality - replace with real API calls
const mockConversations = [
  {
    id: "1",
    title: "Revenue Analysis Q4",
    preview: "Top customers by revenue in North America",
    timestamp: "2h ago",
  },
  {
    id: "2",
    title: "Product Performance",
    preview: "Best selling products by category",
    timestamp: "1d ago",
  },
  {
    id: "3",
    title: "Customer Churn Analysis",
    preview: "Analyze customer retention patterns",
    timestamp: "3d ago",
  },
];

const mockWorkflowSteps = [
  {
    id: "1",
    stepNumber: 1,
    question: "Show top 10 customers by revenue in North America",
    sqlSnippet: "SELECT customer_id, SUM(order_total)...",
    timestamp: "2:30 PM",
    status: "completed" as const,
  },
  {
    id: "2",
    stepNumber: 2,
    question: "Break down by product category",
    sqlSnippet: "SELECT category, SUM(revenue)...",
    timestamp: "2:35 PM",
    status: "current" as const,
  },
];

const mockSQL = `SELECT 
  customer_id,
  customer_name,
  SUM(order_total) AS total_revenue,
  COUNT(DISTINCT order_id) AS order_count
FROM analytics.orders o
LEFT JOIN analytics.customers c 
  ON o.customer_id = c.id
WHERE order_date >= '2024-01-01'
  AND region = 'North America'
GROUP BY customer_id, customer_name
ORDER BY total_revenue DESC
LIMIT 100`;

const mockResultColumns = ["customer_id", "customer_name", "total_revenue", "order_count"];

const mockResultData = [
  { customer_id: "C-001", customer_name: "Acme Corp", total_revenue: 125000, order_count: 45 },
  { customer_id: "C-002", customer_name: "TechStart Inc", total_revenue: 98500, order_count: 32 },
  { customer_id: "C-003", customer_name: "Global Dynamics", total_revenue: 87200, order_count: 28 },
  { customer_id: "C-004", customer_name: "Innovate LLC", total_revenue: 76800, order_count: 24 },
  { customer_id: "C-005", customer_name: "DataFlow Systems", total_revenue: 65400, order_count: 21 },
];

const mockAgents = [
  { name: "Intent Parser", status: "completed" as const },
  { name: "RAG Retrieval", status: "completed" as const },
  { name: "SQL Generator", status: "completed" as const },
  { name: "Validator", status: "completed" as const },
  { name: "Cost Optimizer", status: "completed" as const },
];

const mockRecommendedSteps = [
  { id: "1", label: "Break down revenue by product category", type: "drill-down" as const },
  { id: "2", label: "Compare with previous year performance", type: "compare" as const },
  { id: "3", label: "Analyze customer retention rate", type: "aggregate" as const },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  hasResponse?: boolean;
}

export default function AnalyticsPortal() {
  const [role, setRole] = useState("analyst");
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>("1");
  const [isProcessing, setIsProcessing] = useState(false);

  // todo: remove mock functionality
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "Show me the top 10 customers by revenue in North America for 2024",
      timestamp: "2:34 PM",
    },
    {
      id: "2",
      role: "assistant",
      content: "I'll analyze the customer revenue data for North America. I've parsed your intent, retrieved the relevant schema from our RAG system, and generated an optimized SQL query. The query passed validation and has been cost-optimized for efficient execution.",
      timestamp: "2:34 PM",
      hasResponse: true,
    },
  ]);

  const handleSendMessage = (content: string) => {
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsProcessing(true);

    // todo: remove mock functionality - simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm processing your request: "${content}". I've analyzed your intent, retrieved relevant schema context, and generated an optimized SQL query for your analysis.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        hasResponse: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSelectRecommendedStep = (step: { id: string; label: string; type: string }) => {
    handleSendMessage(step.label);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        currentRole={role}
        onRoleChange={setRole}
        workflowPanelOpen={workflowPanelOpen}
        onToggleWorkflowPanel={() => setWorkflowPanelOpen(!workflowPanelOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          conversations={mockConversations}
          activeId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={handleNewConversation}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.length === 0 ? (
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
                    secure, optimized SQL queries and provide actionable insights.
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
                messages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    <MessageBubble
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                    />
                    {message.hasResponse && message.role === "assistant" && (
                      <QueryResponse
                        sql={mockSQL}
                        columns={mockResultColumns}
                        data={mockResultData}
                        costEstimate={{
                          bytesScanned: "2.4 GB",
                          credits: 0.0234,
                          optimizationScore: 85,
                          warnings: [],
                        }}
                        accessControl={{
                          role: role.toUpperCase(),
                          maskedColumns: role === "analyst" ? ["email", "phone_number"] : [],
                          restrictedTables: role === "analyst" ? ["hr.salaries"] : [],
                          rowFilters:
                            role === "analyst" ? ["region IN ('NA', 'US', 'CA')"] : [],
                        }}
                        recommendedSteps={mockRecommendedSteps}
                        agents={mockAgents}
                        onSelectStep={handleSelectRecommendedStep}
                        isLoading={isProcessing}
                      />
                    )}
                  </div>
                ))
              )}

              {isProcessing && messages[messages.length - 1]?.role === "user" && (
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

          <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </main>

        {workflowPanelOpen && (
          <WorkflowPanel
            steps={mockWorkflowSteps}
            onSelectStep={(id) => console.log("Load step:", id)}
            onExport={() => console.log("Export workflow")}
            onClear={() => console.log("Clear workflow")}
          />
        )}
      </div>
    </div>
  );
}
