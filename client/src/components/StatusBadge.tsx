import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, X, Info } from "lucide-react";

type StatusType = "success" | "error" | "warning" | "info";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

const statusConfig = {
  success: {
    variant: "default" as const,
    icon: Check,
    className: "bg-emerald-600 text-white",
  },
  error: {
    variant: "destructive" as const,
    icon: X,
    className: "",
  },
  warning: {
    variant: "default" as const,
    icon: AlertTriangle,
    className: "bg-amber-500 text-white",
  },
  info: {
    variant: "secondary" as const,
    icon: Info,
    className: "",
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1 text-xs font-medium ${config.className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
