import { useEffect, useState } from 'react';

import { fetchDashboardStats } from '../lib/api';
import type { DashboardStats } from '../types';

const emptyStats: DashboardStats = {
  totals: {
    conversations: 0,
    open_tickets: 0,
    unresolved_conversations: 0,
    bot_failures: 0
  },
  recent_conversations: [],
  open_tickets: [],
  common_issue_categories: [],
  recent_failures: []
};

export function DashboardPanel() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await fetchDashboardStats();
        setStats(response);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  return (
    <section className="panel dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h2>Operational overview</h2>
        </div>
      </div>

      {error ? <div className="status-banner status-banner--error">{error}</div> : null}

      <div className="stat-grid">
        <div className="stat-card">
          <span>Total conversations</span>
          <strong>{stats.totals.conversations}</strong>
        </div>
        <div className="stat-card">
          <span>Open tickets</span>
          <strong>{stats.totals.open_tickets}</strong>
        </div>
        <div className="stat-card">
          <span>Unresolved</span>
          <strong>{stats.totals.unresolved_conversations}</strong>
        </div>
        <div className="stat-card">
          <span>Bot failures</span>
          <strong>{stats.totals.bot_failures}</strong>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-card">
          <h3>Recent conversations</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="dashboard-list">
              {stats.recent_conversations.map((conversation) => (
                <li key={conversation.id}>
                  <strong>{conversation.session_id}</strong>
                  <span>{conversation.latest_message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Open support tickets</h3>
          <ul className="dashboard-list">
            {stats.open_tickets.map((ticket) => (
              <li key={ticket.id}>
                <strong>{ticket.issue_category}</strong>
                <span>{ticket.issue_summary}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-card">
          <h3>Top issue categories</h3>
          <ul className="dashboard-list">
            {stats.common_issue_categories.map((item) => (
              <li key={item.category}>
                <strong>{item.category}</strong>
                <span>{item.total} conversations</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

