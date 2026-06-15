import type { ReactNode } from 'react';

import { StatusChip } from './StatusChip';

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  badge: string;
  context?: ReactNode;
  actionLabel?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  description,
  variant,
  badge,
  context,
  actionLabel,
  onClick
}: MetricCardProps) {
  const className = `metric-card metric-card--${variant}${onClick ? ' metric-card--interactive' : ''}`;

  const content = (
    <>
      <div className="metric-card__header">
        <span>{label}</span>
        <StatusChip variant={variant}>{badge}</StatusChip>
      </div>
      <strong>{value}</strong>
      <p>{description}</p>
      {context ? <div className="metric-card__context">{context}</div> : null}
      {actionLabel ? <div className="metric-card__action">{actionLabel}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <article className={className}>
      {content}
    </article>
  );
}
