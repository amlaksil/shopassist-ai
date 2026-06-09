import { useState } from 'react';

import { ChatPanel } from './components/ChatPanel';
import { DashboardPanel } from './components/DashboardPanel';

type View = 'chat' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('chat');

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">AI Customer Support</p>
          <h1>ShopAssist AI</h1>
          <p className="hero-copy">
            A production-minded support assistant for e-commerce teams with provider-based AI,
            grounded answers, conversation logging, and ticket escalation.
          </p>
        </div>

        <nav className="view-switcher" aria-label="Primary">
          <button
            className={view === 'chat' ? 'is-active' : ''}
            onClick={() => setView('chat')}
            type="button"
          >
            Chat Experience
          </button>
          <button
            className={view === 'dashboard' ? 'is-active' : ''}
            onClick={() => setView('dashboard')}
            type="button"
          >
            Admin Dashboard
          </button>
        </nav>
      </section>

      {view === 'chat' ? <ChatPanel /> : <DashboardPanel />}
    </main>
  );
}
