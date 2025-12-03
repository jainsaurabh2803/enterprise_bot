import WorkflowStep from "../WorkflowStep";

export default function WorkflowStepExample() {
  return (
    <div className="w-80 space-y-3">
      <WorkflowStep
        stepNumber={1}
        question="Show top 10 customers by revenue"
        sqlSnippet="SELECT customer_id, SUM(order_total)..."
        timestamp="2:30 PM"
        status="completed"
        onClick={() => console.log("Clicked step 1")}
      />
      <WorkflowStep
        stepNumber={2}
        question="Break down by product category"
        sqlSnippet="SELECT category, SUM(revenue)..."
        timestamp="2:35 PM"
        status="current"
        onClick={() => console.log("Clicked step 2")}
      />
    </div>
  );
}
