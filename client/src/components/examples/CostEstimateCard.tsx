import CostEstimateCard from "../CostEstimateCard";

export default function CostEstimateCardExample() {
  return (
    <CostEstimateCard
      bytesScanned="2.4 GB"
      credits={0.0234}
      optimizationScore={75}
      warnings={["Consider adding partition filter on order_date"]}
    />
  );
}
