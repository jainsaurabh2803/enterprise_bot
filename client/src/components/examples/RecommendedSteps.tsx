import RecommendedSteps from "../RecommendedSteps";

const steps = [
  { id: "1", label: "Break down revenue by product category", type: "drill-down" as const },
  { id: "2", label: "Compare with previous year performance", type: "compare" as const },
  { id: "3", label: "Filter by customer segment", type: "filter" as const },
];

export default function RecommendedStepsExample() {
  return (
    <RecommendedSteps
      steps={steps}
      onSelect={(step) => console.log("Selected step:", step.label)}
    />
  );
}
