import StatusBadge from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="success" label="PASS" />
      <StatusBadge status="error" label="FAIL" />
      <StatusBadge status="warning" label="High Cost" />
      <StatusBadge status="info" label="Info" />
    </div>
  );
}
