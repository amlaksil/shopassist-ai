export type Sender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: Sender;
  content: string;
  created_at: string;
  status?: string;
}

export interface CustomerInfo {
  name?: string;
  email?: string;
  issue_summary?: string;
}

export interface CreateTicketPayload {
  session_id: string;
  issue_category: string;
  customer: Required<CustomerInfo>;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  status: 'answered' | 'clarification_needed' | 'ticket_required' | 'ticket_created' | 'error';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  model: string;
  ticket_id?: string;
  requires_customer_details?: boolean;
  missing_customer_fields?: Array<keyof CustomerInfo>;
}

export interface ConversationSummary {
  id: string;
  session_id: string;
  channel: string;
  status: string;
  provider_used: string;
  created_at: string;
  updated_at: string;
  latest_message: string;
}

export interface SupportTicket {
  id: string;
  session_id: string;
  name: string;
  email: string;
  issue_summary: string;
  issue_category: string;
  status: string;
  created_at: string;
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
