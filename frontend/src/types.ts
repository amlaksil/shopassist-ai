export type Sender = 'user' | 'assistant';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type ConversationStatus =
  | 'answered'
  | 'clarification_needed'
  | 'ticket_required'
  | 'ticket_created'
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'error';
export type WorkspaceSection =
  | 'dashboard'
  | 'conversations'
  | 'tickets';

export interface NavigationItem {
  id: WorkspaceSection;
  label: string;
}

export interface AdminSession {
  email: string;
  display_name: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  content: string;
  created_at: string;
  status?: ConversationStatus;
}

export interface CustomerInfo {
  name?: string;
  email?: string;
  issue_summary?: string;
}

export interface TicketContextPayload {
  order_number?: string | null;
  checkout_email?: string | null;
  shipment_status?: string | null;
  escalation_reason?: string | null;
  priority?: PriorityLevel | null;
  timeline_summary?: string | null;
}

export interface CreateTicketPayload {
  session_id: string;
  issue_category: string;
  customer: Required<CustomerInfo>;
  ticket_context?: TicketContextPayload;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  status: ConversationStatus;
  category: string;
  confidence: ConfidenceLevel;
  provider: string;
  model: string;
  ticket_id?: string;
  requires_customer_details?: boolean;
  missing_customer_fields?: Array<keyof CustomerInfo>;
  suggested_customer?: Partial<CustomerInfo>;
  ticket_context?: TicketContextPayload;
}

export interface ConversationSummary {
  id: string;
  session_id: string;
  channel: string;
  status: ConversationStatus;
  provider_used: string;
  created_at: string;
  updated_at: string;
  latest_message: string;
  assignee?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  issue_category?: string | null;
}

export interface ConversationHistoryMessage {
  id: string;
  conversation_id: string;
  session_id: string;
  role: Sender;
  content: string;
  provider_used?: string | null;
  model_used?: string | null;
  status: ConversationStatus;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  session_id: string;
  name: string;
  email: string;
  issue_summary: string;
  issue_category: string;
  status: string;
  assignee?: string | null;
  order_number?: string | null;
  checkout_email?: string | null;
  shipment_status?: string | null;
  escalation_reason?: string | null;
  priority?: PriorityLevel | null;
  timeline_summary?: string | null;
  provider_used?: string | null;
  model_used?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  totals: {
    conversations: number;
    open_tickets: number;
    unresolved_conversations: number;
    bot_failures: number;
  };
  recent_conversations: ConversationSummary[];
  open_tickets: SupportTicket[];
  common_issue_categories: Array<{
    category: string;
    total: number;
  }>;
  recent_failures: ConversationSummary[];
}
