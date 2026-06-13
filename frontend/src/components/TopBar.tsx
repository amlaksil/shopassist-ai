import type { NavigationItem } from '../types';

interface TopBarProps {
  activeItem: NavigationItem;
  searchQuery: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onExperienceChange: () => void;
}

const subtitles: Record<string, string> = {
  Dashboard: 'A simple overview of customer conversations and open work.',
  Conversations: 'Review recent customer messages and follow up where needed.',
  Tickets: 'Track open requests and keep handoffs moving.',
  'Help Center': 'Keep common answers and support topics easy to find.',
  Reports: 'See what customers need help with most often.',
  Settings: 'Manage the support team’s working preferences.'
};

export function TopBar({
  activeItem,
  searchQuery,
  searchPlaceholder,
  onSearchChange,
  onExperienceChange
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <p className="topbar__eyebrow">Support dashboard</p>
        <h2>{activeItem.label}</h2>
        <span>{subtitles[activeItem.label]}</span>
      </div>

      <label className="topbar__search" htmlFor="global-search">
        <span className="sr-only">Search support dashboard</span>
        <input
          id="global-search"
          aria-label="Search support dashboard"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchQuery}
        />
      </label>

      <div className="topbar__meta">
        <button className="secondary-button" onClick={onExperienceChange} type="button">
          Customer view
        </button>
        <div className="topbar__user" aria-label="Current support team workspace">
          <span className="topbar__avatar" aria-hidden="true">
            ST
          </span>
          <span className="topbar__user-copy">
            <strong>Support team</strong>
            <small>Ready to follow up</small>
          </span>
        </div>
      </div>
    </header>
  );
}
