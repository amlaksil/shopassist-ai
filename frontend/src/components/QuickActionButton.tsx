interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
}

export function QuickActionButton({ label, onClick }: QuickActionButtonProps) {
  return (
    <button className="quick-action-button" onClick={onClick} type="button">
      {label}
    </button>
  );
}
