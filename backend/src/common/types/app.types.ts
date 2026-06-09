export type ConversationStatus =
  | 'answered'
  | 'clarification_needed'
  | 'ticket_required'
  | 'ticket_created'
  | 'error';

export type MessageRole = 'user' | 'assistant';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CustomerInfo {
  name?: string;
  email?: string;
  issue_summary?: string;
}

export interface FaqArticle {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  inventory_status: string;
  attributes: string[];
}

export interface ConversationRecord {
  id: string;
  session_id: string;
  channel: string;
  status: ConversationStatus;
  provider_used: string;
  created_at: string;
  updated_at: string;
  latest_message: string;
  customer_name?: string | null;
  customer_email?: string | null;
  issue_category?: string | null;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  session_id: string;
  role: MessageRole;
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
  status: 'open' | 'in_progress' | 'resolved';
  provider_used?: string | null;
  model_used?: string | null;
  created_at: string;
}

export interface KnowledgeContext {
  faqs: FaqArticle[];
  products: Product[];
  summary: string;
}

export interface DashboardStats {
  totals: {
    conversations: number;
    open_tickets: number;
    unresolved_conversations: number;
    bot_failures: number;
  };
  recent_conversations: ConversationRecord[];
  open_tickets: SupportTicket[];
  common_issue_categories: Array<{
    category: string;
    total: number;
  }>;
  recent_failures: ConversationRecord[];
}

export interface ChatResponsePayload {
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
}

export interface SupportTicketRequest {
  session_id: string;
  customer: Required<CustomerInfo>;
  issue_category: string;
}

export interface SupportTicketResponsePayload {
  session_id: string;
  answer: string;
  status: 'ticket_created';
  category: string;
  confidence: 'high';
  provider: string;
  model: string;
  ticket_id: string;
}
