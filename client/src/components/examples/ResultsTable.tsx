import ResultsTable from "../ResultsTable";

const columns = ["customer_id", "customer_name", "total_revenue", "order_count"];

const data = [
  { customer_id: "C-001", customer_name: "Acme Corp", total_revenue: 125000, order_count: 45 },
  { customer_id: "C-002", customer_name: "TechStart Inc", total_revenue: 98500, order_count: 32 },
  { customer_id: "C-003", customer_name: "Global Dynamics", total_revenue: 87200, order_count: 28 },
  { customer_id: "C-004", customer_name: "Innovate LLC", total_revenue: 76800, order_count: 24 },
  { customer_id: "C-005", customer_name: "DataFlow Systems", total_revenue: 65400, order_count: 21 },
];

export default function ResultsTableExample() {
  return <ResultsTable columns={columns} data={data} />;
}
