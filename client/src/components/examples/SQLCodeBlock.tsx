import SQLCodeBlock from "../SQLCodeBlock";

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

export default function SQLCodeBlockExample() {
  return <SQLCodeBlock sql={exampleSQL} />;
}
