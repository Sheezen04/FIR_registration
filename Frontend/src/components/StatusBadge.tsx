import { FIRStatus, Priority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/data/firData";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: FIRStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.color)}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.color)}>
      {config.label}
    </span>
  );
}
