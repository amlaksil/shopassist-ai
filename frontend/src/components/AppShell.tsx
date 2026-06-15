import type { ReactNode } from 'react';

import type { AdminSession, NavigationItem, WorkspaceSection } from '../types';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  navigation: NavigationItem[];
  activeSection: WorkspaceSection;
  searchQuery: string;
  searchPlaceholder: string;
  onSectionChange: (section: WorkspaceSection) => void;
  onSearchChange: (value: string) => void;
  onExperienceChange: () => void;
  onSignOut: () => void;
  adminUser: AdminSession;
  children: ReactNode;
}

export function AppShell({
  navigation,
  activeSection,
  searchQuery,
  searchPlaceholder,
  onSectionChange,
  onSearchChange,
  onExperienceChange,
  onSignOut,
  adminUser,
  children
}: AppShellProps) {
  const activeItem = navigation.find((item) => item.id === activeSection) ?? navigation[0];

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        navigation={navigation}
        onSectionChange={onSectionChange}
      />

      <div className="app-shell__main">
        <TopBar
          activeItem={activeItem}
          adminUser={adminUser}
          onExperienceChange={onExperienceChange}
          onSearchChange={onSearchChange}
          onSignOut={onSignOut}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
