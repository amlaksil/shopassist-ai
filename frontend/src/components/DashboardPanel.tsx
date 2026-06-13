import { useEffect, useMemo, useState } from 'react';

import {
  fetchConversationMessages,
  fetchDashboardStats,
  fetchRecentConversations,
  updateSupportTicket
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
  authToken: string;
  searchQuery: string;
  viewFilter: 'all' | 'waiting' | 'resolved';
  onNavigate: (section: WorkspaceSection, filter?: 'all' | 'waiting' | 'resolved') => void;
}

interface SummaryCardData {
  label: string;
  value: string;
  description: string;
  variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  badge: string;
  actionLabel: string;
  nextSection: WorkspaceSection;
  filter: 'all' | 'waiting' | 'resolved';
}

const assigneeOptions = [
  'Support team',
  'Order desk',
  'Returns desk',
  'Billing desk',
  'Hana Tesfaye',
  'Samuel Bekele',
  'Meklit Alemu'
] as const;

function getSuggestedAssignee(ticket: SupportTicket) {
  const category = ticket.issue_category.toLowerCase();

  if (
    category.includes('return') ||
    category.includes('refund') ||
    category.includes('damaged') ||
    category.includes('wrong_item')
  ) {
    return 'Returns desk';
  }

  if (
    category.includes('shipping') ||
    category.includes('delivery') ||
    category.includes('missing')
  ) {
    return 'Order desk';
  }

  return 'Support team';
}

function buildTicketStageCopy(ticket: SupportTicket) {
  switch (ticket.status) {
    case 'in_progress':
      return {
        title: 'Work is in progress',
        description: 'A support teammate is actively handling this request.'
      };
    case 'waiting_on_customer':
      return {
        title: 'Waiting for the customer',
        description: 'The team is waiting for a reply or the missing details needed to continue.'
      };
    case 'resolved':
      return {
        title: 'Ticket resolved',
        description: 'This request is closed and has been removed from the active queue.'
      };
    case 'open':
    default:
      return {
        title: 'Ready for follow-up',
        description: 'Choose an owner, then move the ticket into active work when someone starts handling it.'
      };
  }
}

export function DashboardPanel({
  activeSection,
  authToken,
  searchQuery,
  viewFilter,
  onNavigate
}: DashboardPanelProps) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationHistoryMessage[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketActionLoading, setTicketActionLoading] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, [authToken]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    const baseRows = stats.recent_conversations.filter((conversation) => {
      if (viewFilter === 'waiting') {
        return (
          conversation.status === 'clarification_needed' ||
          conversation.status === 'ticket_required' ||
          conversation.status === 'waiting_on_customer'
        );
      }

      if (viewFilter === 'resolved') {
        return conversation.status === 'answered' || conversation.status === 'resolved';
      }

      return true;
    });

    return baseRows.filter((conversation) => {
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
      });
  }, [normalizedQuery, stats.recent_conversations, viewFilter]);

  const filteredTickets = useMemo(
    () =>
      stats.open_tickets.filter((ticket) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          ticket.name,
          ticket.email,
          ticket.issue_category,
          ticket.issue_summary,
          ticket.session_id,
          ticket.order_number ?? '',
          ticket.assignee ?? '',
          ticket.escalation_reason ?? ''
        ]
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
          conversation.status === 'waiting_on_customer' ||
          conversation.status === 'error'
      ),
    [stats.recent_conversations]
  );

  async function handleViewConversation(conversation: ConversationSummary) {
    setSelectedConversation(conversation);
    setPreviewLoading(true);

    try {
      const response = await fetchConversationMessages(conversation.session_id, authToken);
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

  async function loadDashboard(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const [dashboardResponse, recentConversationResponse] = await Promise.all([
        fetchDashboardStats(authToken),
        fetchRecentConversations(authToken)
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
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function handleTicketAction(action: {
    status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved';
    assignee?: string;
  }) {
    if (!selectedTicket) {
      return;
    }

    try {
      setTicketActionLoading(true);
      const updated = await updateSupportTicket({
        id: selectedTicket.id,
        token: authToken,
        status: action.status,
        assignee: action.assignee
      });

      setSelectedTicket(updated);
      await loadDashboard(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update ticket');
    } finally {
      setTicketActionLoading(false);
    }
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
      render: (conversation) =>
        buildAssignedTo(conversation.status, false, conversation.assignee)
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
          <span>
            {ticket.order_number ? `${ticket.order_number} · ` : ''}
            {ticket.issue_summary}
          </span>
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
      render: (ticket) => ticket.assignee ?? 'Unassigned'
    },
    {
      key: 'updated',
      header: 'Last updated',
      render: (ticket) => formatDateTime(ticket.updated_at ?? ticket.created_at)
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
                actionLabel={card.actionLabel}
                badge={card.badge}
                description={card.description}
                label={card.label}
                onClick={() => onNavigate(card.nextSection, card.filter)}
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
            summaryLabel={`${filteredConversations.slice(0, 8).length} shown`}
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
            summaryLabel={`${filteredTickets.slice(0, 8).length} shown`}
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
                  <h3>Waiting for customer</h3>
                  <p>Only conversations blocked on a customer reply appear here.</p>
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
                    <strong>No customer replies are pending</strong>
                    <span>Anything waiting on the customer will appear here.</span>
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
            description="Recent customer conversations and their current support status."
            emptyMessage={
              loading
                ? 'Loading conversations.'
                : normalizedQuery
                  ? 'No conversations match the current search.'
                  : 'Customer conversations will appear here.'
            }
            rows={filteredConversations}
            summaryLabel={`${filteredConversations.length} total`}
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
            description="Active tickets that still need follow-up. Resolved tickets move out of this queue."
            emptyMessage={
              loading
                ? 'Loading tickets.'
                : normalizedQuery
                  ? 'No tickets match the current search.'
                  : 'Active tickets will appear here.'
            }
            rows={filteredTickets}
            summaryLabel={`${filteredTickets.length} active`}
            title="Ticket list"
          />

          <TicketDetail
            conversation={selectedConversation}
            onTicketAction={handleTicketAction}
            loading={previewLoading}
            messages={conversationMessages}
            ticket={selectedTicket}
            ticketActionLoading={ticketActionLoading}
          />
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
      badge: 'Today',
      actionLabel: 'Open conversation queue',
      nextSection: 'conversations',
      filter: 'all'
    },
    {
      label: 'Open tickets',
      value: stats.totals.open_tickets.toString(),
      description:
        stats.totals.open_tickets > 0 ? 'Requests waiting for support follow-up.' : 'No open tickets right now.',
      variant: stats.totals.open_tickets > 0 ? 'warning' : 'success',
      badge: stats.totals.open_tickets > 0 ? 'Open' : 'Clear',
      actionLabel: 'Review ticket queue',
      nextSection: 'tickets',
      filter: 'all'
    },
    {
      label: 'Waiting for reply',
      value: stats.totals.unresolved_conversations.toString(),
      description:
        stats.totals.unresolved_conversations > 0
          ? 'Conversations waiting on more details or a next step.'
          : 'No customer conversations are waiting right now.',
      variant: stats.totals.unresolved_conversations > 0 ? 'warning' : 'success',
      badge: stats.totals.unresolved_conversations > 0 ? 'Waiting' : 'Up to date',
      actionLabel: 'See waiting conversations',
      nextSection: 'conversations',
      filter: 'waiting'
    },
    {
      label: 'Resolved today',
      value: resolvedToday.toString(),
      description: 'Conversations that moved forward without needing extra follow-up.',
      variant: 'info',
      badge: 'Resolved',
      actionLabel: 'Review resolved conversations',
      nextSection: 'conversations',
      filter: 'resolved'
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
          <dd>{buildAssignedTo(conversation.status, false, conversation.assignee)}</dd>
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
  conversation: ConversationSummary | null;
  messages: ConversationHistoryMessage[];
  loading: boolean;
  ticketActionLoading: boolean;
  onTicketAction: (action: {
    status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved';
    assignee?: string;
  }) => Promise<void>;
}

function TicketDetail({
  ticket,
  conversation,
  messages,
  loading,
  ticketActionLoading,
  onTicketAction
}: TicketDetailProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>(assigneeOptions[0]);

  useEffect(() => {
    if (!ticket) {
      return;
    }

    setSelectedAssignee(ticket.assignee ?? getSuggestedAssignee(ticket));
  }, [ticket]);

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
  const stageCopy = buildTicketStageCopy(ticket);
  const isResolved = ticket.status === 'resolved';
  const hasOwner = Boolean(ticket.assignee);

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
          <dt>Linked order</dt>
          <dd>{ticket.order_number ?? 'Not attached'}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{toTitleCase(priority)}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>{ticket.assignee ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDateTime(ticket.updated_at ?? ticket.created_at)}</dd>
        </div>
        <div>
          <dt>Shipment status</dt>
          <dd>{ticket.shipment_status ? toTitleCase(ticket.shipment_status) : 'Not available'}</dd>
        </div>
      </dl>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Customer issue</strong>
        </div>
        <p className="preview-transcript__copy">{ticket.issue_summary}</p>
      </div>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>{stageCopy.title}</strong>
        </div>
        <p className="preview-transcript__copy">{stageCopy.description}</p>
      </div>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Support context</strong>
        </div>
        <ul className="detail-list">
          <li>
            <strong>Escalation reason</strong>
            <span>{ticket.escalation_reason ?? 'Customer asked for follow-up support.'}</span>
          </li>
          <li>
            <strong>Timeline summary</strong>
            <span>{ticket.timeline_summary ?? 'No order timeline was attached to this ticket.'}</span>
          </li>
        </ul>
      </div>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Ticket actions</strong>
        </div>
        <div className="ticket-workflow">
          <div className="ticket-workflow__group">
            <div className="ticket-workflow__copy">
              <strong>Owner</strong>
              <span>Choose who should handle this request.</span>
            </div>
            <div className="ticket-assignee-picker">
              <label className="sr-only" htmlFor="ticket-assignee">
                Assign ticket owner
              </label>
              <select
                id="ticket-assignee"
                value={selectedAssignee}
                onChange={(event) => setSelectedAssignee(event.target.value)}
                disabled={ticketActionLoading}
              >
                {assigneeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                className="secondary-button"
                disabled={ticketActionLoading || selectedAssignee === (ticket.assignee ?? '')}
                onClick={() => void onTicketAction({ assignee: selectedAssignee })}
                type="button"
              >
                {ticket.assignee ? 'Update owner' : 'Assign owner'}
              </button>
            </div>
          </div>

          <div className="ticket-workflow__group">
            <div className="ticket-workflow__copy">
              <strong>Ticket status</strong>
              <span>Move the ticket to the next clear step for the support team.</span>
            </div>
            <div className="ticket-status-actions">
              <button
                className="secondary-button"
                disabled={ticketActionLoading || ticket.status === 'open'}
                onClick={() => void onTicketAction({ status: 'open' })}
                type="button"
              >
                {isResolved ? 'Reopen ticket' : 'Move back to open'}
              </button>
              <button
                className="secondary-button"
                disabled={ticketActionLoading || ticket.status === 'in_progress' || !hasOwner}
                onClick={() => void onTicketAction({ status: 'in_progress' })}
                type="button"
              >
                Move to in progress
              </button>
              <button
                className="secondary-button"
                disabled={
                  ticketActionLoading || ticket.status === 'waiting_on_customer' || !hasOwner
                }
                onClick={() => void onTicketAction({ status: 'waiting_on_customer' })}
                type="button"
              >
                Waiting for customer
              </button>
              <button
                className="primary-button"
                disabled={ticketActionLoading || isResolved}
                onClick={() => void onTicketAction({ status: 'resolved' })}
                type="button"
              >
                Resolve ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-transcript">
        <div className="preview-transcript__header">
          <strong>Customer message history</strong>
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
            {conversation
              ? 'No saved messages were found for this ticket yet.'
              : 'Open a linked conversation to see the message history.'}
          </p>
        )}
      </div>
    </section>
  );
}
