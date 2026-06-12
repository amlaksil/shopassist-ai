import type { ReactNode } from 'react';

import { StatusChip } from './StatusChip';

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  badge: string;
  context?: ReactNode;
}

export function MetricCard({
  label,
  value,
  description,
  variant,
  badge,
  context
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${variant}`}>
      <div className="metric-card__header">
        <span>{label}</span>
        <StatusChip variant={variant}>{badge}</StatusChip>
      </div>
      <strong>{value}</strong>
      <p>{description}</p>
      {context ? <div className="metric-card__context">{context}</div> : null}
    </article>
  );
}
