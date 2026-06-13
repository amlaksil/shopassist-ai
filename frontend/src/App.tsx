import { useState } from 'react';

import { AppShell } from './components/AppShell';
import { ChatPanel } from './components/ChatPanel';
import { DashboardPanel } from './components/DashboardPanel';
import type { NavigationItem, WorkspaceSection } from './types';

type Experience = 'customer' | 'admin';

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard'
  },
  {
    id: 'conversations',
    label: 'Conversations'
  },
  {
    id: 'tickets',
    label: 'Tickets'
  },
  {
    id: 'help_center',
    label: 'Help Center'
  },
  {
    id: 'reports',
    label: 'Reports'
  },
  {
    id: 'settings',
    label: 'Settings'
  }
];

const searchPlaceholders: Record<WorkspaceSection, string> = {
  dashboard: 'Search conversations, tickets, or customers',
  conversations: 'Search customer conversations',
  tickets: 'Search tickets or customer names',
  help_center: 'Search help topics or saved replies',
  reports: 'Search recent trends or issues',
  settings: 'Search support settings'
};

export default function App() {
  const [experience, setExperience] = useState<Experience>('customer');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return experience === 'customer' ? (
    <ChatPanel onOpenAdmin={() => setExperience('admin')} />
  ) : (
    <AppShell
      activeSection={activeSection}
      navigation={navigationItems}
      onExperienceChange={() => setExperience('customer')}
      onSearchChange={setSearchQuery}
      onSectionChange={setActiveSection}
      searchPlaceholder={searchPlaceholders[activeSection]}
      searchQuery={searchQuery}
    >
      <DashboardPanel activeSection={activeSection} searchQuery={searchQuery} />
    </AppShell>
  );
}
