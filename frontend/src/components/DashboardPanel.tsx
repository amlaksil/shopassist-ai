import { useEffect, useMemo, useState } from 'react';

import {
  fetchConversationMessages,
  fetchDashboardStats,
  fetchRecentConversations
} from '../lib/api';
import {
  buildAssignedTo,
  buildBotFailureReason,
  derivePriorityFromConversation,
  derivePriorityFromTicket,
  formatDateTime,
  getConversationDisplayName,
  getConversationSecondaryLabel,
  getPriorityVariant,
  getStatusVariant,
  getSupportStatusLabel,
  getTicketDisplayName,
  getTicketSecondaryLabel,
  toTitleCase
} from '../lib/insights';
import type {
  ConversationHistoryMessage,
  ConversationSummary,
  DashboardStats,
  SupportTicket,
  WorkspaceSection
} from '../types';
import { DashboardTable, type DashboardTableColumn } from './DashboardTable';
import { MetricCard } from './MetricCard';
import { StatusChip } from './StatusChip';

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

interface DashboardPanelProps {
  activeSection: WorkspaceSection;
  searchQuery: string;
}

const sectionCopy: Record<
  WorkspaceSection,
  { title: string; description: string }
> = {
  dashboard: {
    title: 'Support overview',
    description: 'See what needs attention, what is moving well, and where customers need help.'
  },
  conversations: {
    title: 'Conversations',
    description: 'Review recent customer messages and keep the next step clear.'
  },
  tickets: {
    title: 'Tickets',
    description: 'Manage open requests and make sure follow-up stays on track.'
  },
  help_center: {
    title: 'Help Center',
    description: 'Keep common topics and saved responses easy for the team to use.'
  },
  reports: {
    title: 'Reports',
    description: 'Look at common issues, open work, and recent follow-up needs.'
  },
  settings: {
    title: 'Settings',
    description: 'Organize support hours, handoff rules, and team-ready response content.'
  }
};

interface SummaryCardData {
  label: string;
  value: string;
  description: string;
  variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  badge: string;
}

export function DashboardPanel({ activeSection, searchQuery }: DashboardPanelProps) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationHistoryMessage[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashboardResponse, recentConversationResponse] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentConversations()
        ]);

        const mergedConversations =
          recentConversationResponse.length > dashboardResponse.recent_conversations.length
            ? recentConversationResponse
            : dashboardResponse.recent_conversations;

        setStats({
          ...dashboardResponse,
          recent_conversations: mergedConversations
        });
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = useMemo(
    () =>
      stats.recent_conversations.filter((conversation) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          conversation.customer_name ?? '',
          conversation.customer_email ?? '',
          conversation.session_id,
          conversation.issue_category ?? '',
          conversation.latest_message
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, stats.recent_conversations]
  );

  const filteredTickets = useMemo(
    () =>
      stats.open_tickets.filter((ticket) => {
        if (!normalizedQuery) {
          return true;
        }

        return [ticket.name, ticket.email, ticket.issue_category, ticket.issue_summary, ticket.session_id]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, stats.open_tickets]
  );

  const filteredCategories = useMemo(
    () =>
      stats.common_issue_categories.filter((item) =>
        !normalizedQuery ? true : item.category.toLowerCase().includes(normalizedQuery)
      ),
    [normalizedQuery, stats.common_issue_categories]
  );

  const summaryCards = useMemo(() => buildSummaryCards(stats), [stats]);
  const recentFollowUps = useMemo(
    () =>
      stats.recent_conversations.filter(
        (conversation) =>
          conversation.status === 'clarification_needed' ||
          conversation.status === 'ticket_required' ||
          conversation.status === 'ticket_created' ||
          conversation.status === 'error'
      ),
    [stats.recent_conversations]
  );

  async function handleViewConversation(conversation: ConversationSummary) {
    setSelectedConversation(conversation);
    setPreviewLoading(true);

    try {
      const response = await fetchConversationMessages(conversation.session_id);
      setConversationMessages(response);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load conversation');
      setConversationMessages([]);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleReviewTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket);

    const linkedConversation =
      stats.recent_conversations.find((conversation) => conversation.session_id === ticket.session_id) ??
      buildSyntheticConversation(ticket);

    void handleViewConversation(linkedConversation);
  }

  const conversationColumns: DashboardTableColumn<ConversationSummary>[] = [
    {
      key: 'customer',
      header: 'Customer',
      className: 'table-cell--wide',
      render: (conversation) => (
        <div className="table-identity">
          <strong>{getConversationDisplayName(conversation)}</strong>
          <span>{getConversationSecondaryLabel(conversation)}</span>
        </div>
      )
    },
    {
      key: 'topic',
      header: 'Topic',
      className: 'table-cell--wide',
      render: (conversation) => (
        <div className="table-identity">
          <strong>{toTitleCase(conversation.issue_category ?? 'general')}</strong>
          <span>{conversation.latest_message}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (conversation) => (
        <StatusChip variant={getStatusVariant(conversation.status)}>
          {getSupportStatusLabel(conversation.status)}
        </StatusChip>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (conversation) => {
        const priority = derivePriorityFromConversation(conversation);

        return (
          <StatusChip variant={getPriorityVariant(priority)}>{toTitleCase(priority)}</StatusChip>
        );
      }
    },
    {
      key: 'assigned',
      header: 'Assigned to',
      render: (conversation) => buildAssignedTo(conversation.status)
    },
    {
      key: 'updated',
      header: 'Last updated',
      render: (conversation) => formatDateTime(conversation.updated_at)
    },
    {
      key: 'action',
      header: 'Action',
      render: (conversation) => (
        <button className="table-action" onClick={() => void handleViewConversation(conversation)} type="button">
          Open
        </button>
      )
    }
  ];

  const ticketColumns: DashboardTableColumn<SupportTicket>[] = [
    {
      key: 'customer',
      header: 'Customer',
      className: 'table-cell--wide',
      render: (ticket) => (
        <div className="table-identity">
          <strong>{getTicketDisplayName(ticket)}</strong>
          <span>{getTicketSecondaryLabel(ticket)}</span>
        </div>
      )
    },
    {
      key: 'issue',
      header: 'Issue',
      className: 'table-cell--wide',
      render: (ticket) => (
        <div className="table-identity">
          <strong>{toTitleCase(ticket.issue_category)}</strong>
          <span>{ticket.issue_summary}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (ticket) => (
        <StatusChip variant={getStatusVariant(ticket.status)}>
          {getSupportStatusLabel(ticket.status)}
        </StatusChip>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (ticket) => {
        const priority = derivePriorityFromTicket(ticket);

        return (
          <StatusChip variant={getPriorityVariant(priority)}>{toTitleCase(priority)}</StatusChip>
        );
      }
    },
    {
      key: 'assigned',
      header: 'Assigned to',
      render: () => 'Support team'
    },
    {
      key: 'updated',
      header: 'Last updated',
      render: (ticket) => formatDateTime(ticket.created_at)
    },
    {
      key: 'action',
      header: 'Action',
      render: (ticket) => (
        <button className="table-action" onClick={() => handleReviewTicket(ticket)} type="button">
          Open
        </button>
      )
    }
  ];

  return (
    <section className="support-page">
      <header className="support-page__header">
        <div>
          <h1>{sectionCopy[activeSection].title}</h1>
          <p>{sectionCopy[activeSection].description}</p>
        </div>
      </header>

      {error ? (
        <div className="status-banner status-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      {activeSection === 'dashboard' ? (
        <>
          <section className="metric-grid">
            {summaryCards.map((card) => (
              <MetricCard
                key={card.label}
                badge={card.badge}
                description={card.description}
                label={card.label}
                value={card.value}
                variant={card.variant}
              />
            ))}
          </section>

          <DashboardTable
            columns={conversationColumns}
            description="Recent customer conversations."
            emptyMessage={
              loading
                ? 'Loading recent conversations.'
                : normalizedQuery
                  ? 'No conversations match the current search.'
                  : 'New conversations will appear here.'
            }
            rows={filteredConversations.slice(0, 8)}
            title="Recent conversations"
          />

          <DashboardTable
            columns={ticketColumns}
            description="Open customer requests."
            emptyMessage={
              loading
                ? 'Loading open tickets.'
                : normalizedQuery
                  ? 'No tickets match the current search.'
                  : 'Open tickets will appear here when customers need follow-up.'
            }
            rows={filteredTickets.slice(0, 8)}
            title="Open tickets"
          />

          <section className="support-grid support-grid--compact">
            <article className="workspace-card">
              <header className="workspace-card__header">
                <div>
                  <h3>Common issues</h3>
                  <p>Topics customers are asking about most often.</p>
                </div>
              </header>
              <ul className="category-list">
                {filteredCategories.length > 0 ? (
                  filteredCategories.slice(0, 5).map((item) => (
                    <li key={item.category}>
                      <div>
                        <strong>{toTitleCase(item.category)}</strong>
                        <span>{item.total} conversations</span>
                      </div>
                      <StatusChip variant="neutral">Common</StatusChip>
                    </li>
                  ))
                ) : (
                  <li className="section-empty">
                    <strong>No issues to show</strong>
                    <span>Common topics will appear here once more conversations come in.</span>
                  </li>
                )}
              </ul>
            </article>

            <article className="workspace-card">
              <header className="workspace-card__header">
                <div>
                  <h3>Needs follow-up</h3>
                  <p>Conversations that still need a next step.</p>
                </div>
              </header>
              <ul className="detail-list">
                {recentFollowUps.length > 0 ? (
                  recentFollowUps.slice(0, 5).map((conversation) => (
                    <li key={conversation.id}>
                      <strong>{getConversationDisplayName(conversation)}</strong>
                      <span>{getSupportStatusLabel(conversation.status)}</span>
                    </li>
                  ))
                ) : (
                  <li className="section-empty">
                    <strong>Nothing waiting right now</strong>
                    <span>Items that need follow-up will appear here.</span>
                  </li>
                )}
              </ul>
            </article>
          </section>
        </>
      ) : null}

      {activeSection === 'conversations' ? (
        <section className="support-grid support-grid--detail">
          <DashboardTable
            columns={conversationColumns}
            description="Customer conversations waiting for review or follow-up."
            emptyMessage={
              loading
                ? 'Loading conversations.'
                : normalizedQuery
                  ? 'No conversations match the current search.'
                  : 'Customer conversations will appear here.'
            }
            rows={filteredConversations}
            title="Conversation list"
          />

          <ConversationDetail
            conversation={selectedConversation}
            loading={previewLoading}
            messages={conversationMessages}
          />
        </section>
      ) : null}

      {activeSection === 'tickets' ? (
        <section className="support-grid support-grid--detail">
          <DashboardTable
            columns={ticketColumns}
            description="Open tickets that need a support teammate."
            emptyMessage={
              loading
                ? 'Loading tickets.'
                : normalizedQuery
                  ? 'No tickets match the current search.'
                  : 'Open tickets will appear here.'
            }
            rows={filteredTickets}
            title="Ticket list"
          />

          <TicketDetail ticket={selectedTicket} />
        </section>
      ) : null}

      {activeSection === 'help_center' ? (
        <section className="support-grid support-grid--compact">
          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Common help topics</h3>
                <p>Use these topics to guide consistent customer replies.</p>
              </div>
            </header>
            <ul className="detail-list">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((item) => (
                  <li key={item.category}>
                    <strong>{toTitleCase(item.category)}</strong>
                    <span>{item.total} recent conversations</span>
                  </li>
                ))
              ) : (
                <li className="section-empty">
                  <strong>No help topics to show</strong>
                  <span>Help topics will grow as more conversations are stored.</span>
                </li>
              )}
            </ul>
          </article>

          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Saved replies</h3>
                <p>Short answers the team can reuse when helping customers.</p>
              </div>
            </header>
            <ul className="detail-list">
              <li>
                <strong>Shipping update</strong>
                <span>Let the customer know when tracking is expected and what to check next.</span>
              </li>
              <li>
                <strong>Refund follow-up</strong>
                <span>Confirm the next step and when the customer should expect an update.</span>
              </li>
              <li>
                <strong>Return instructions</strong>
                <span>Share the return steps clearly and keep the process easy to follow.</span>
              </li>
            </ul>
          </article>
        </section>
      ) : null}

      {activeSection === 'reports' ? (
        <>
          <section className="metric-grid metric-grid--compact">
            {summaryCards.map((card) => (
              <MetricCard
                key={card.label}
                badge={card.badge}
                description={card.description}
                label={card.label}
                value={card.value}
                variant={card.variant}
              />
            ))}
          </section>

          <section className="support-grid support-grid--compact">
            <article className="workspace-card">
              <header className="workspace-card__header">
                <div>
                  <h3>Common issues</h3>
                  <p>What customers need the most help with lately.</p>
                </div>
              </header>
              <ul className="category-list">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((item) => (
                    <li key={item.category}>
                      <div>
                        <strong>{toTitleCase(item.category)}</strong>
                        <span>{item.total} conversations</span>
                      </div>
                      <StatusChip variant="neutral">Trend</StatusChip>
                    </li>
                  ))
                ) : (
                  <li className="section-empty">
                    <strong>No issue trends yet</strong>
                    <span>Issue patterns will appear here as the support inbox grows.</span>
                  </li>
                )}
              </ul>
            </article>

            <article className="workspace-card">
              <header className="workspace-card__header">
                <div>
                  <h3>Recent follow-up needs</h3>
                  <p>Conversations that still need a clear next step.</p>
                </div>
              </header>
              <ul className="detail-list">
                {recentFollowUps.length > 0 ? (
                  recentFollowUps.map((conversation) => (
                    <li key={conversation.id}>
                      <strong>{getConversationDisplayName(conversation)}</strong>
                      <span>
                        {getSupportStatusLabel(conversation.status)}
                        {conversation.status === 'error'
                          ? ` · ${buildBotFailureReason(conversation)}`
                          : ''}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="section-empty">
                    <strong>No follow-up items right now</strong>
                    <span>Items that need attention will show here.</span>
                  </li>
                )}
              </ul>
            </article>
          </section>
        </>
      ) : null}

      {activeSection === 'settings' ? (
        <section className="support-grid support-grid--compact">
          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Support hours</h3>
                <p>Show the team when follow-up is expected.</p>
              </div>
            </header>
            <ul className="detail-list">
              <li>
                <strong>Weekdays</strong>
                <span>9:00 AM to 6:00 PM</span>
              </li>
              <li>
                <strong>Weekend coverage</strong>
                <span>Urgent tickets only</span>
              </li>
            </ul>
          </article>

          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Escalation preferences</h3>
                <p>Keep handoffs consistent and easy to manage.</p>
              </div>
            </header>
            <ul className="detail-list">
              <li>
                <strong>Refund requests</strong>
                <span>Send to support team for review.</span>
              </li>
              <li>
                <strong>Complaints</strong>
                <span>Mark for same-day follow-up.</span>
              </li>
              <li>
                <strong>Order issues</strong>
                <span>Ask for order details before handing off.</span>
              </li>
            </ul>
          </article>

          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Saved replies</h3>
                <p>Keep helpful answers ready for the team.</p>
              </div>
            </header>
            <ul className="detail-list">
              <li>
                <strong>Shipping delay</strong>
                <span>Explain the delay and set the next update clearly.</span>
              </li>
              <li>
                <strong>Refund received</strong>
                <span>Confirm the request and expected timeline.</span>
              </li>
            </ul>
          </article>

          <article className="workspace-card">
            <header className="workspace-card__header">
              <div>
                <h3>Help topics</h3>
                <p>Keep support guidance organized around common customer needs.</p>
              </div>
            </header>
            <ul className="detail-list">
              <li>
                <strong>Orders</strong>
                <span>Tracking, delivery, and missing package help.</span>
              </li>
              <li>
                <strong>Returns and refunds</strong>
                <span>Return steps, refund timing, and damaged item follow-up.</span>
              </li>
            </ul>
          </article>
        </section>
      ) : null}
    </section>
  );
}

function buildSummaryCards(stats: DashboardStats): SummaryCardData[] {
  const resolvedToday = Math.max(
    stats.totals.conversations - stats.totals.unresolved_conversations - stats.totals.bot_failures,
    0
  );

  return [
    {
      label: 'Total conversations',
      value: stats.totals.conversations.toString(),
      description: 'Recent customer conversations across the support inbox.',
      variant: 'brand',
      badge: 'Today'
    },
    {
      label: 'Open tickets',
      value: stats.totals.open_tickets.toString(),
      description:
        stats.totals.open_tickets > 0 ? 'Requests waiting for support follow-up.' : 'No open tickets right now.',
      variant: stats.totals.open_tickets > 0 ? 'warning' : 'success',
      badge: stats.totals.open_tickets > 0 ? 'Open' : 'Clear'
    },
    {
      label: 'Waiting for reply',
      value: stats.totals.unresolved_conversations.toString(),
      description:
        stats.totals.unresolved_conversations > 0
          ? 'Conversations waiting on more details or a next step.'
          : 'No customer conversations are waiting right now.',
      variant: stats.totals.unresolved_conversations > 0 ? 'warning' : 'success',
      badge: stats.totals.unresolved_conversations > 0 ? 'Waiting' : 'Up to date'
    },
    {
      label: 'Resolved today',
      value: resolvedToday.toString(),
      description: 'Conversations that moved forward without needing extra follow-up.',
      variant: 'info',
      badge: 'Resolved'
    }
  ];
}

function buildSyntheticConversation(ticket: SupportTicket): ConversationSummary {
  return {
    id: ticket.id,
    session_id: ticket.session_id,
    channel: 'webchat',
    status: 'ticket_created',
    provider_used: ticket.provider_used ?? 'system',
    created_at: ticket.created_at,
    updated_at: ticket.created_at,
    latest_message: ticket.issue_summary,
    customer_name: ticket.name,
    customer_email: ticket.email,
    issue_category: ticket.issue_category
  };
}

interface ConversationDetailProps {
  conversation: ConversationSummary | null;
  messages: ConversationHistoryMessage[];
  loading: boolean;
}

function ConversationDetail({ conversation, messages, loading }: ConversationDetailProps) {
  if (!conversation) {
    return (
      <section className="workspace-card">
        <header className="workspace-card__header">
          <div>
            <h3>Conversation details</h3>
            <p>Select a conversation to read the latest customer messages.</p>
          </div>
        </header>
        <p className="workspace-card__empty">
          Open any conversation to see the customer’s latest message, the current status, and the
          next step.
        </p>
      </section>
    );
  }

  const priority = derivePriorityFromConversation(conversation);

  return (
    <section className="workspace-card workspace-card--preview">
      <header className="workspace-card__header">
        <div>
          <h3>Conversation details</h3>
          <p>{getConversationDisplayName(conversation)}</p>
        </div>
        <StatusChip variant={getStatusVariant(conversation.status)}>
          {getSupportStatusLabel(conversation.status)}
        </StatusChip>
      </header>

      <dl className="detail-grid">
        <div>
          <dt>Customer</dt>
          <dd>{getConversationDisplayName(conversation)}</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>{toTitleCase(conversation.issue_category ?? 'general')}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{toTitleCase(priority)}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>{buildAssignedTo(conversation.status)}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>{getConversationSecondaryLabel(conversation)}</dd>
        </div>
      </dl>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Latest messages</strong>
        </div>

        {loading ? (
          <p className="workspace-card__empty">Loading messages.</p>
        ) : messages.length > 0 ? (
          <ul className="preview-message-list">
            {messages.map((message) => (
              <li key={message.id}>
                <strong>{message.role === 'assistant' ? 'Support assistant' : 'Customer'}</strong>
                <span>{message.content}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="workspace-card__empty">
            No saved messages were found for this conversation yet.
          </p>
        )}
      </div>
    </section>
  );
}

interface TicketDetailProps {
  ticket: SupportTicket | null;
}

function TicketDetail({ ticket }: TicketDetailProps) {
  if (!ticket) {
    return (
      <section className="workspace-card">
        <header className="workspace-card__header">
          <div>
            <h3>Ticket details</h3>
            <p>Select a ticket to review the customer issue.</p>
          </div>
        </header>
        <p className="workspace-card__empty">
          Open any ticket to review the issue summary, priority, and who should follow up next.
        </p>
      </section>
    );
  }

  const priority = derivePriorityFromTicket(ticket);

  return (
    <section className="workspace-card workspace-card--preview">
      <header className="workspace-card__header">
        <div>
          <h3>Ticket details</h3>
          <p>{getTicketDisplayName(ticket)}</p>
        </div>
        <StatusChip variant={getStatusVariant(ticket.status)}>
          {getSupportStatusLabel(ticket.status)}
        </StatusChip>
      </header>

      <dl className="detail-grid">
        <div>
          <dt>Customer</dt>
          <dd>{getTicketDisplayName(ticket)}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{getTicketSecondaryLabel(ticket)}</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>{toTitleCase(ticket.issue_category)}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{toTitleCase(priority)}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>Support team</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDateTime(ticket.created_at)}</dd>
        </div>
      </dl>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Customer issue</strong>
        </div>
        <p className="preview-transcript__copy">{ticket.issue_summary}</p>
      </div>
    </section>
  );
}
