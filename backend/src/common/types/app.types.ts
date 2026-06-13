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

export type MessageRole = 'user' | 'assistant';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface CustomerInfo {
  name?: string;
  email?: string;
  issue_summary?: string;
}

export interface TicketContextPayload {
  order_number?: string | null;
  checkout_email?: string | null;
  shipment_status?: ShipmentRecord['status'] | 'not_shipped' | null;
  escalation_reason?: string | null;
  priority?: PriorityLevel | null;
  timeline_summary?: string | null;
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

export interface CustomerRecord {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  customer_id: string;
  status:
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'exception'
    | 'cancelled';
  total_amount: number;
  currency: string;
  placed_at: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: string;
}

export interface ShipmentRecord {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  status:
    | 'label_created'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'delayed'
    | 'exception';
  latest_update: string;
  last_location: string | null;
  estimated_delivery_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReturnRecord {
  id: string;
  order_id: string;
  status: 'requested' | 'approved' | 'received' | 'completed' | 'rejected';
  reason: string;
  requested_at: string;
  updated_at: string;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  status: 'pending' | 'processed' | 'failed';
  amount: number;
  currency: string;
  requested_at: string;
  processed_at: string | null;
  updated_at: string;
}

export interface OrderLookupPayload {
  order_number: string;
  order_status: OrderRecord['status'];
  customer_name: string | null;
  customer_email: string | null;
  placed_at: string;
  item_summary: string;
  shipment_status: ShipmentRecord['status'] | 'not_shipped';
  carrier: string | null;
  tracking_number: string | null;
  latest_update: string;
  last_location: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  support_summary: string;
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
  assignee?: string | null;
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
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved';
  assignee?: string | null;
  order_number?: string | null;
  checkout_email?: string | null;
  shipment_status?: ShipmentRecord['status'] | 'not_shipped' | null;
  escalation_reason?: string | null;
  priority?: PriorityLevel | null;
  timeline_summary?: string | null;
  provider_used?: string | null;
  model_used?: string | null;
  created_at: string;
  updated_at?: string;
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
  suggested_customer?: Partial<CustomerInfo>;
  ticket_context?: TicketContextPayload;
}

export interface SupportTicketRequest {
  session_id: string;
  customer: Required<CustomerInfo>;
  issue_category: string;
  ticket_context?: TicketContextPayload;
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
