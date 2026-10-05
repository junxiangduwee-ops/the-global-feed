import { STATUS_CONFIG, type ReleaseStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ReleaseStatus] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className="status-badge"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
