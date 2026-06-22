/*
 * Entry point for the customer chat at `/` and the protected support workspace at `/admin`.
 */
import { useEffect, useState } from 'react';

import { AdminAuthPanel } from './components/AdminAuthPanel';
import { AppShell } from './components/AppShell';
import { ChatPanel } from './components/ChatPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { fetchAdminSession } from './lib/api';
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase';
import type { AdminSession, NavigationItem, WorkspaceSection } from './types';

type Experience = 'customer' | 'admin';
type AdminViewFilter = 'all' | 'waiting' | 'resolved';
type AdminAuthStatus = 'loading' | 'signed_out' | 'ready' | 'forbidden' | 'error';

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
  }
];

const searchPlaceholders: Record<WorkspaceSection, string> = {
  dashboard: 'Search conversations, tickets, or customers',
  conversations: 'Search customer conversations',
  tickets: 'Search tickets or customer names'
};

const allowAdminSignUp = import.meta.env.VITE_ADMIN_ALLOW_SIGNUP === 'true';

function isForbiddenError(message: string) {
  return message.toLowerCase().includes('not approved');
}

function isExpiredSessionError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('sign in') || normalized.includes('no longer valid');
}

export default function App() {
  const [experience, setExperience] = useState<Experience>(() =>
    resolveExperienceFromPath(window.location.pathname)
  );
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dashboard');
  const [adminViewFilter, setAdminViewFilter] = useState<AdminViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminAuthStatus, setAdminAuthStatus] = useState<AdminAuthStatus>('loading');
  const [adminAuthMessage, setAdminAuthMessage] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminSession | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    function handlePopState() {
      setExperience(resolveExperienceFromPath(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      if (resolveExperienceFromPath(window.location.pathname) === 'admin') {
        void refreshAdminAccess();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (experience === 'admin') {
      void refreshAdminAccess();
    }
  }, [experience]);

  async function refreshAdminAccess() {
    if (!isSupabaseConfigured()) {
      setAdminAuthStatus('error');
      setAdminAuthMessage(
        'Admin sign-in requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'
      );
      setAdminToken(null);
      setAdminUser(null);
      return;
    }

    try {
      setAdminAuthStatus('loading');
      setAdminAuthMessage(null);

      const supabase = getSupabaseClient();
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.access_token) {
        setAdminAuthStatus('signed_out');
        setAdminAuthMessage('Sign in with an approved support email to open the admin workspace.');
        setAdminToken(null);
        setAdminUser(null);
        return;
      }

      const verifiedAdminUser = await fetchAdminSession(session.access_token);

      setAdminToken(session.access_token);
      setAdminUser(verifiedAdminUser);
      setAdminAuthStatus('ready');
      setAdminAuthMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify admin access.';

      if (isForbiddenError(message)) {
        setAdminAuthStatus('forbidden');
        setAdminAuthMessage(message);
        setAdminToken(null);
        setAdminUser(null);
        return;
      }

      if (isExpiredSessionError(message)) {
        setAdminAuthStatus('signed_out');
        setAdminAuthMessage('Sign in again to continue in the admin workspace.');
        setAdminToken(null);
        setAdminUser(null);
        return;
      }

      setAdminAuthStatus('error');
      setAdminAuthMessage(message);
      setAdminToken(null);
      setAdminUser(null);
    }
  }

  async function handleAdminSignIn(email: string, password: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    await refreshAdminAccess();
  }

  async function handleAdminSignUp(email: string, password: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    await refreshAdminAccess();
  }

  async function handleAdminSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    }

    setAdminToken(null);
    setAdminUser(null);
    setAdminAuthStatus('signed_out');
    setAdminAuthMessage('Signed out. Sign in again to reopen the admin workspace.');
  }

  function openCustomerView() {
    navigateTo('/');
    setExperience('customer');
  }

  function handleSectionChange(section: WorkspaceSection) {
    setActiveSection(section);
    setAdminViewFilter('all');
    setSearchQuery('');
  }

  function handleDashboardNavigate(section: WorkspaceSection, filter: AdminViewFilter = 'all') {
    setActiveSection(section);
    setAdminViewFilter(filter);
    setSearchQuery('');
  }

  if (experience === 'customer') {
    return <ChatPanel />;
  }

  if (adminAuthStatus !== 'ready' || !adminToken || !adminUser) {
    return (
      <AdminAuthPanel
        allowSignUp={allowAdminSignUp}
        message={adminAuthMessage}
        onSignIn={handleAdminSignIn}
        onSignOut={handleAdminSignOut}
        onSignUp={handleAdminSignUp}
        status={adminAuthStatus}
      />
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      adminUser={adminUser}
      navigation={navigationItems}
      onExperienceChange={openCustomerView}
      onSearchChange={setSearchQuery}
      onSectionChange={handleSectionChange}
      onSignOut={() => {
        void handleAdminSignOut();
      }}
      searchPlaceholder={searchPlaceholders[activeSection]}
      searchQuery={searchQuery}
    >
      <DashboardPanel
        activeSection={activeSection}
        authToken={adminToken}
        onNavigate={handleDashboardNavigate}
        searchQuery={searchQuery}
        viewFilter={adminViewFilter}
      />
    </AppShell>
  );
}
