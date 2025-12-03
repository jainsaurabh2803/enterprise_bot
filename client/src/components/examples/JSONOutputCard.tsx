import JSONOutputCard from "../JSONOutputCard";

const mockResponse = {
  intent_summary: "Retrieve top customers by revenue for North America region in 2024",
  retrieved_context: "Table: analytics.orders, analytics.customers. Columns: customer_id, order_total, region, order_date",
  generated_sql: "SELECT customer_id, SUM(order_total) FROM analytics.orders...",
  access_control_applied: "Role: ANALYST. Row filter: region IN ('NA', 'US', 'CA')",
  cost_estimate: "~2.4 GB scanned, 0.0234 credits",
  validation_status: "PASS" as const,
  explainability_notes: "Partition pruning applied on order_date. No sensitive columns accessed.",
  result_preview: "5 rows returned. Top customer: Acme Corp ($125,000)",
  workflow_step_saved: true,
  recommended_next_steps: [
    "Break down revenue by product category",
    "Compare with previous year performance",
    "Analyze customer retention rate",
  ],
  reporting_ready: true,
};

export default function JSONOutputCardExample() {
  return <JSONOutputCard response={mockResponse} />;
}
