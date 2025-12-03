import QueryResponse from "../QueryResponse";

const exampleSQL = `SELECT 
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

const columns = ["customer_id", "customer_name", "total_revenue", "order_count"];

const data = [
  { customer_id: "C-001", customer_name: "Acme Corp", total_revenue: 125000, order_count: 45 },
  { customer_id: "C-002", customer_name: "TechStart Inc", total_revenue: 98500, order_count: 32 },
  { customer_id: "C-003", customer_name: "Global Dynamics", total_revenue: 87200, order_count: 28 },
];

const agents = [
  { name: "Intent Parser", status: "completed" as const },
  { name: "RAG", status: "completed" as const },
  { name: "SQL Gen", status: "completed" as const },
  { name: "Validator", status: "completed" as const },
  { name: "Cost Opt", status: "completed" as const },
];

const recommendedSteps = [
  { id: "1", label: "Break down revenue by product category", type: "drill-down" as const },
  { id: "2", label: "Compare with previous year performance", type: "compare" as const },
];

export default function QueryResponseExample() {
  return (
    <QueryResponse
      sql={exampleSQL}
      columns={columns}
      data={data}
      costEstimate={{
        bytesScanned: "2.4 GB",
        credits: 0.0234,
        optimizationScore: 85,
        warnings: [],
      }}
      accessControl={{
        role: "ANALYST",
        maskedColumns: ["email", "phone"],
        restrictedTables: [],
        rowFilters: ["region = 'North America'"],
      }}
      recommendedSteps={recommendedSteps}
      agents={agents}
      onSelectStep={(step) => console.log("Selected:", step)}
    />
  );
}
