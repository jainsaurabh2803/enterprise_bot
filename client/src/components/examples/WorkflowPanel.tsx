import WorkflowPanel from "../WorkflowPanel";

const mockSteps = [
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
  {
    id: "3",
    stepNumber: 3,
    question: "Compare with last year",
    sqlSnippet: "SELECT YEAR(order_date), SUM(...)...",
    timestamp: "2:40 PM",
    status: "pending" as const,
  },
];

export default function WorkflowPanelExample() {
  return (
    <div className="h-[500px]">
      <WorkflowPanel
        steps={mockSteps}
        onSelectStep={(id) => console.log("Selected step:", id)}
        onExport={() => console.log("Export workflow")}
        onClear={() => console.log("Clear workflow")}
      />
    </div>
  );
}
