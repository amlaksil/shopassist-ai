import type { ReactNode } from 'react';

interface StatusChipProps {
  children: ReactNode;
  variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function StatusChip({ children, variant, size = 'md' }: StatusChipProps) {
  return (
    <span className={`status-chip status-chip--${variant} status-chip--${size}`}>{children}</span>
  );
}
