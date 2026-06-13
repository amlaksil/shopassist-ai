import type {
  ConversationStatus,
  ConversationSummary,
  SupportTicket
} from '../types';

type ChipVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type PriorityLevel = 'high' | 'medium' | 'low';

export interface MetricDefinition {
  label: string;
  value: string;
  description: string;
  variant: ChipVariant;
  badge: string;
}

export function getConversationDisplayName(conversation: ConversationSummary) {
  if (conversation.customer_name?.trim()) {
    return conversation.customer_name.trim();
  }

  return `Shopper ${buildReferenceCode(conversation.session_id)}`;
}

export function getConversationSecondaryLabel(conversation: ConversationSummary) {
  if (conversation.customer_email?.trim()) {
    return conversation.customer_email.trim();
  }

  const topic = toTitleCase(conversation.issue_category ?? 'support');
  return `${topic} request · Ref ${buildReferenceCode(conversation.session_id)}`;
}

export function getTicketDisplayName(ticket: SupportTicket) {
  if (ticket.name.trim()) {
    return ticket.name.trim();
  }

  return `Shopper ${buildReferenceCode(ticket.session_id)}`;
}

export function getTicketSecondaryLabel(ticket: SupportTicket) {
  if (ticket.order_number?.trim()) {
    return ticket.email.trim()
      ? `${ticket.email.trim()} · ${ticket.order_number.trim()}`
      : `Order ${ticket.order_number.trim()}`;
  }

  if (ticket.email.trim()) {
    return ticket.email.trim();
  }

  return `Support request · Ref ${buildReferenceCode(ticket.session_id)}`;
}

export function formatStatusLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getSupportStatusLabel(status: string) {
  switch (status) {
    case 'answered':
      return 'Resolved';
    case 'clarification_needed':
      return 'Waiting for customer';
    case 'ticket_required':
      return 'Needs details';
    case 'ticket_created':
      return 'Needs follow-up';
    case 'error':
      return 'Needs review';
    case 'open':
      return 'Open';
    case 'resolved':
      return 'Resolved';
    default:
      return formatStatusLabel(status);
  }
}

export function toTitleCase(value: string) {
  return value
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatTimeOnly(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getStatusVariant(status: string): ChipVariant {
  switch (status) {
    case 'answered':
    case 'resolved':
    case 'ready':
      return 'success';
    case 'clarification_needed':
    case 'ticket_required':
    case 'waiting':
    case 'not_configured':
      return 'warning';
    case 'ticket_created':
    case 'open':
    case 'escalated':
      return 'info';
    case 'error':
    case 'bot_failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getPriorityVariant(priority: PriorityLevel): ChipVariant {
  switch (priority) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
}

export function derivePriorityFromConversation(conversation: ConversationSummary): PriorityLevel {
  const category = normalizeCategory(conversation.issue_category ?? conversation.latest_message);

  if (
    conversation.status === 'error' ||
    category.includes('refund') ||
    category.includes('payment') ||
    category.includes('account') ||
    category.includes('damaged') ||
    category.includes('wrong_item') ||
    category.includes('missing_delivery')
  ) {
    return 'high';
  }

  if (
    conversation.status === 'ticket_required' ||
    conversation.status === 'ticket_created' ||
    category.includes('return') ||
    category.includes('order') ||
    category.includes('shipping_delay')
  ) {
    return 'medium';
  }

  return 'low';
}

export function derivePriorityFromTicket(ticket: SupportTicket): PriorityLevel {
  if (ticket.priority) {
    return ticket.priority;
  }

  const category = normalizeCategory(ticket.issue_category);

  if (
    category.includes('refund') ||
    category.includes('payment') ||
    category.includes('account') ||
    category.includes('damaged') ||
    category.includes('wrong_item') ||
    category.includes('missing_delivery')
  ) {
    return 'high';
  }

  if (
    category.includes('return') ||
    category.includes('shipping') ||
    category.includes('order') ||
    category.includes('delay')
  ) {
    return 'medium';
  }

  return 'low';
}

export function buildAssignedTo(status: ConversationStatus | string, escalated = false) {
  if (status === 'ticket_created' || escalated) {
    return 'Support team';
  }

  if (status === 'ticket_required' || status === 'clarification_needed') {
    return 'Unassigned';
  }

  return 'Automation';
}

export function buildBotFailureReason(conversation: ConversationSummary) {
  if (conversation.status !== 'error') {
    return 'No failure detected.';
  }

  return 'The assistant could not finish this request clearly and it needs a follow-up.';
}

function normalizeCategory(value: string | null | undefined) {
  return (value ?? '').toLowerCase();
}

function buildReferenceCode(value: string) {
  const compact = value.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase();
  return compact || '0000';
}
