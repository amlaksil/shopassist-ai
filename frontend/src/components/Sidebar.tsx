import type { NavigationItem, WorkspaceSection } from '../types';

interface SidebarProps {
  navigation: NavigationItem[];
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
}

export function Sidebar({ navigation, activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Support dashboard navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">
          SA
        </div>
        <div>
          <p className="sidebar__eyebrow">Support dashboard</p>
          <h1>ShopAssist AI</h1>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navigation.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === activeSection}
            className={`sidebar__nav-item ${item.id === activeSection ? 'is-active' : ''}`}
            onClick={() => onSectionChange(item.id)}
            type="button"
          >
            <span className="sidebar__nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
