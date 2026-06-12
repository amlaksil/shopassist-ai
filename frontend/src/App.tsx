import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { ChatPanel } from './components/ChatPanel';
import { DashboardPanel } from './components/DashboardPanel';
import type { NavigationItem, WorkspaceSection } from './types';

type Experience = 'customer' | 'admin';

function resolveExperienceFromPath(pathname: string): Experience {
  return pathname.startsWith('/admin') ? 'admin' : 'customer';
}

function navigateTo(pathname: string) {
  if (window.location.pathname !== pathname) {
    window.history.pushState({}, '', pathname);
  }
}

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
  const [experience, setExperience] = useState<Experience>(() =>
    resolveExperienceFromPath(window.location.pathname)
  );
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function handlePopState() {
      setExperience(resolveExperienceFromPath(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function openCustomerView() {
    navigateTo('/');
    setExperience('customer');
  }

  return experience === 'customer' ? (
    <ChatPanel />
  ) : (
    <AppShell
      activeSection={activeSection}
      navigation={navigationItems}
      onExperienceChange={openCustomerView}
      onSearchChange={setSearchQuery}
      onSectionChange={setActiveSection}
      searchPlaceholder={searchPlaceholders[activeSection]}
      searchQuery={searchQuery}
    >
      <DashboardPanel activeSection={activeSection} searchQuery={searchQuery} />
    </AppShell>
  );
}
