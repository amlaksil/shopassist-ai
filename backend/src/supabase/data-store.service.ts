import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

import type {
  CustomerRecord,
  ConversationRecord,
  ConversationStatus,
  DashboardStats,
  FaqArticle,
  OrderItemRecord,
  OrderRecord,
  Product,
  RefundRecord,
  ReturnRecord,
  ShipmentRecord,
  StoredMessage,
  TicketContextPayload,
  SupportTicket
} from '../common/types/app.types';

interface EnsureConversationInput {
  session_id: string;
  status: ConversationStatus;
  provider_used: string;
  latest_message?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  issue_category?: string | null;
}

interface MessageInsertInput {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  provider_used?: string | null;
  model_used?: string | null;
  status: ConversationStatus;
}

interface TicketInsertInput {
  session_id: string;
  name: string;
  email: string;
  issue_summary: string;
  issue_category: string;
  ticket_context?: TicketContextPayload;
  provider_used?: string | null;
  model_used?: string | null;
}

interface ProviderMetadata {
  provider: string;
  model: string;
}

@Injectable()
export class DataStoreService {
  private readonly logger = new Logger(DataStoreService.name);
  private readonly supabase: SupabaseClient | null;
  private readonly localFaqArticles: FaqArticle[];
  private readonly localProducts: Product[];
  private readonly localCustomers: CustomerRecord[];
  private readonly localOrders: OrderRecord[];
  private readonly localOrderItems: OrderItemRecord[];
  private readonly localShipments: ShipmentRecord[];
  private readonly localReturns: ReturnRecord[];
  private readonly localRefunds: RefundRecord[];
  private readonly localConversations = new Map<string, ConversationRecord>();
  private readonly localMessages: StoredMessage[] = [];
  private readonly localTickets: SupportTicket[] = [];

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase =
      supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
          })
        : null;

    this.localFaqArticles = this.loadJsonFile<FaqArticle[]>('data/faqs/faqs.json');
    this.localProducts = this.loadJsonFile<Product[]>('data/products/products.json');
    this.localCustomers = this.loadJsonFile<CustomerRecord[]>('data/commerce/customers.json');
    this.localOrders = this.loadJsonFile<OrderRecord[]>('data/commerce/orders.json');
    this.localOrderItems = this.loadJsonFile<OrderItemRecord[]>('data/commerce/order-items.json');
    this.localShipments = this.loadJsonFile<ShipmentRecord[]>('data/commerce/shipments.json');
    this.localReturns = this.loadJsonFile<ReturnRecord[]>('data/commerce/returns.json');
    this.localRefunds = this.loadJsonFile<RefundRecord[]>('data/commerce/refunds.json');
  }

  getStorageMode() {
    return this.supabase ? 'supabase' : 'memory';
  }

  async getHealthStatus() {
    if (!this.supabase) {
      return {
        configured: false,
        status: 'not_configured' as const
      };
    }

    const { error } = await this.supabase.from('faq_articles').select('id').limit(1);

    if (error) {
      return {
        configured: true,
        status: 'error' as const,
        error: error.message
      };
    }

    return {
      configured: true,
      status: 'ready' as const
    };
  }

  async getFaqArticles(): Promise<FaqArticle[]> {
    if (!this.supabase) {
      return this.localFaqArticles;
    }

    const { data, error } = await this.supabase.from('faq_articles').select('*');

    if (error) {
      this.logger.warn(`Falling back to local FAQ data: ${error.message}`);
      return this.localFaqArticles;
    }

    return (data ?? []) as FaqArticle[];
  }

  async getProducts(): Promise<Product[]> {
    if (!this.supabase) {
      return this.localProducts;
    }

    const { data, error } = await this.supabase.from('products').select('*');

    if (error) {
      this.logger.warn(`Falling back to local product data: ${error.message}`);
      return this.localProducts;
    }

    return (data ?? []) as Product[];
  }

  async getCustomers(): Promise<CustomerRecord[]> {
    if (!this.supabase) {
      return this.localCustomers;
    }

    const { data, error } = await this.supabase.from('customers').select('*');

    if (error) {
      this.logger.warn(`Falling back to local customer data: ${error.message}`);
      return this.localCustomers;
    }

    return (data ?? []) as CustomerRecord[];
  }

  async getOrders(): Promise<OrderRecord[]> {
    if (!this.supabase) {
      return this.localOrders;
    }

    const { data, error } = await this.supabase.from('orders').select('*');

    if (error) {
      this.logger.warn(`Falling back to local order data: ${error.message}`);
      return this.localOrders;
    }

    return (data ?? []) as OrderRecord[];
  }

  async getOrderItems(): Promise<OrderItemRecord[]> {
    if (!this.supabase) {
      return this.localOrderItems;
    }

    const { data, error } = await this.supabase.from('order_items').select('*');

    if (error) {
      this.logger.warn(`Falling back to local order item data: ${error.message}`);
      return this.localOrderItems;
    }

    return (data ?? []) as OrderItemRecord[];
  }

  async getShipments(): Promise<ShipmentRecord[]> {
    if (!this.supabase) {
      return this.localShipments;
    }

    const { data, error } = await this.supabase.from('shipments').select('*');

    if (error) {
      this.logger.warn(`Falling back to local shipment data: ${error.message}`);
      return this.localShipments;
    }

    return (data ?? []) as ShipmentRecord[];
  }

  async getReturns(): Promise<ReturnRecord[]> {
    if (!this.supabase) {
      return this.localReturns;
    }

    const { data, error } = await this.supabase.from('returns').select('*');

    if (error) {
      this.logger.warn(`Falling back to local return data: ${error.message}`);
      return this.localReturns;
    }

    return (data ?? []) as ReturnRecord[];
  }

  async getRefunds(): Promise<RefundRecord[]> {
    if (!this.supabase) {
      return this.localRefunds;
    }

    const { data, error } = await this.supabase.from('refunds').select('*');

    if (error) {
      this.logger.warn(`Falling back to local refund data: ${error.message}`);
      return this.localRefunds;
    }

    return (data ?? []) as RefundRecord[];
  }

  async ensureConversation(input: EnsureConversationInput): Promise<ConversationRecord> {
    if (!this.supabase) {
      const existing = this.localConversations.get(input.session_id);
      const now = new Date().toISOString();
      const record: ConversationRecord = existing
        ? {
            ...existing,
            ...input,
            updated_at: now,
            latest_message: input.latest_message ?? existing.latest_message
          }
        : {
            id: crypto.randomUUID(),
            session_id: input.session_id,
            channel: 'webchat',
            status: input.status,
            provider_used: input.provider_used,
            created_at: now,
            updated_at: now,
            latest_message: input.latest_message ?? '',
            customer_name: input.customer_name ?? null,
            customer_email: input.customer_email ?? null,
            issue_category: input.issue_category ?? null
          };

      this.localConversations.set(input.session_id, record);
      return record;
    }

    const { data: existing, error: selectError } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('session_id', input.session_id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Unable to look up conversation: ${selectError.message}`);
    }

    if (existing) {
      return this.updateConversationRecord(existing.id, existing, input);
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        session_id: input.session_id,
        channel: 'webchat',
        status: input.status,
        provider_used: input.provider_used,
        latest_message: input.latest_message ?? '',
        customer_name: input.customer_name ?? null,
        customer_email: input.customer_email ?? null,
        issue_category: input.issue_category ?? null
      })
      .select('*')
      .single();

    if (error) {
      if (this.isUniqueSessionConstraintError(error)) {
        const { data: conflictedRecord, error: conflictLookupError } = await this.supabase
          .from('conversations')
          .select('*')
          .eq('session_id', input.session_id)
          .maybeSingle();

        if (conflictLookupError) {
          throw new Error(
            `Unable to recover conversation after unique constraint conflict: ${conflictLookupError.message}`
          );
        }

        if (conflictedRecord) {
          return this.updateConversationRecord(conflictedRecord.id, conflictedRecord, input);
        }
      }

      throw new Error(`Unable to create conversation: ${error.message}`);
    }

    return data as ConversationRecord;
  }

  async appendMessage(input: MessageInsertInput): Promise<StoredMessage> {
    const conversation = await this.ensureConversation({
      session_id: input.session_id,
      provider_used: input.provider_used ?? 'system',
      status: input.status,
      latest_message: input.content
    });

    if (!this.supabase) {
      const message: StoredMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        session_id: input.session_id,
        role: input.role,
        content: input.content,
        provider_used: input.provider_used ?? null,
        model_used: input.model_used ?? null,
        status: input.status,
        created_at: new Date().toISOString()
      };

      this.localMessages.push(message);
      return message;
    }

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        session_id: input.session_id,
        role: input.role,
        content: input.content,
        provider_used: input.provider_used ?? null,
        model_used: input.model_used ?? null,
        status: input.status
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Unable to store message: ${error.message}`);
    }

    return data as StoredMessage;
  }

  async getConversationMessages(sessionId: string): Promise<StoredMessage[]> {
    if (!this.supabase) {
      return this.localMessages
        .filter((message) => message.session_id === sessionId)
        .sort((left, right) => left.created_at.localeCompare(right.created_at));
    }

    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Unable to read conversation messages: ${error.message}`);
    }

    return (data ?? []) as StoredMessage[];
  }

  async listRecentConversations(limit = 10): Promise<ConversationRecord[]> {
    if (!this.supabase) {
      return [...this.localConversations.values()]
        .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
        .slice(0, limit);
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Unable to list conversations: ${error.message}`);
    }

    return (data ?? []) as ConversationRecord[];
  }

  async getLatestProviderMetadata(sessionId: string): Promise<ProviderMetadata> {
    if (!this.supabase) {
      const message = [...this.localMessages]
        .reverse()
        .find(
          (entry) =>
            entry.session_id === sessionId && entry.provider_used && entry.model_used
        );

      return {
        provider: message?.provider_used ?? 'system',
        model: message?.model_used ?? 'support-ticket'
      };
    }

    const { data, error } = await this.supabase
      .from('messages')
      .select('provider_used, model_used')
      .eq('session_id', sessionId)
      .not('provider_used', 'is', null)
      .not('model_used', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to resolve provider metadata: ${error.message}`);
    }

    return {
      provider: data?.provider_used ?? 'system',
      model: data?.model_used ?? 'support-ticket'
    };
  }

  async createSupportTicket(input: TicketInsertInput): Promise<SupportTicket> {
    if (!this.supabase) {
      const ticket: SupportTicket = {
        id: crypto.randomUUID(),
        session_id: input.session_id,
        name: input.name,
        email: input.email,
        issue_summary: input.issue_summary,
        issue_category: input.issue_category,
        status: 'open',
        order_number: input.ticket_context?.order_number ?? null,
        checkout_email: input.ticket_context?.checkout_email ?? null,
        shipment_status: input.ticket_context?.shipment_status ?? null,
        escalation_reason: input.ticket_context?.escalation_reason ?? null,
        priority: input.ticket_context?.priority ?? null,
        timeline_summary: input.ticket_context?.timeline_summary ?? null,
        provider_used: input.provider_used ?? null,
        model_used: input.model_used ?? null,
        created_at: new Date().toISOString()
      };

      this.localTickets.unshift(ticket);
      return ticket;
    }

    const { data, error } = await this.supabase
      .from('support_tickets')
      .insert({
        session_id: input.session_id,
        name: input.name,
        email: input.email,
        issue_summary: input.issue_summary,
        issue_category: input.issue_category,
        status: 'open',
        order_number: input.ticket_context?.order_number ?? null,
        checkout_email: input.ticket_context?.checkout_email ?? null,
        shipment_status: input.ticket_context?.shipment_status ?? null,
        escalation_reason: input.ticket_context?.escalation_reason ?? null,
        priority: input.ticket_context?.priority ?? null,
        timeline_summary: input.ticket_context?.timeline_summary ?? null,
        provider_used: input.provider_used ?? null,
        model_used: input.model_used ?? null
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Unable to create ticket: ${error.message}`);
    }

    return data as SupportTicket;
  }

  async listOpenTickets(limit = 10): Promise<SupportTicket[]> {
    if (!this.supabase) {
      return this.localTickets.filter((ticket) => ticket.status === 'open').slice(0, limit);
    }

    const { data, error } = await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Unable to list open tickets: ${error.message}`);
    }

    return (data ?? []) as SupportTicket[];
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const recentConversations = await this.listRecentConversations(8);
    const openTickets = await this.listOpenTickets(8);

    const allConversations = this.supabase
      ? await this.listRecentConversations(1000)
      : [...this.localConversations.values()];
    const allTickets = this.supabase
      ? await this.listOpenTickets(1000)
      : [...this.localTickets];

    const commonIssueCategoriesMap = new Map<string, number>();
    for (const conversation of allConversations) {
      const category = conversation.issue_category ?? 'general';
      commonIssueCategoriesMap.set(category, (commonIssueCategoriesMap.get(category) ?? 0) + 1);
    }

    const commonIssueCategories = [...commonIssueCategoriesMap.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 5);

    const unresolvedConversations = allConversations.filter(
      (conversation) =>
        conversation.status === 'ticket_required' || conversation.status === 'clarification_needed'
    );
    const botFailures = allConversations.filter((conversation) => conversation.status === 'error');

    return {
      totals: {
        conversations: allConversations.length,
        open_tickets: allTickets.filter((ticket) => ticket.status === 'open').length,
        unresolved_conversations: unresolvedConversations.length,
        bot_failures: botFailures.length
      },
      recent_conversations: recentConversations,
      open_tickets: openTickets,
      common_issue_categories: commonIssueCategories,
      recent_failures: botFailures.slice(0, 5)
    };
  }

  private loadJsonFile<T>(relativePath: string): T {
    const fullPath = join(this.resolveProjectRoot(), relativePath);
    return JSON.parse(readFileSync(fullPath, 'utf8')) as T;
  }

  private resolveProjectRoot() {
    const directPath = resolve(process.cwd(), 'data');
    if (existsSync(directPath)) {
      return process.cwd();
    }

    return resolve(process.cwd(), '..');
  }

  private async updateConversationRecord(
    conversationId: string,
    existing: Partial<ConversationRecord>,
    input: EnsureConversationInput
  ): Promise<ConversationRecord> {
    const { data, error } = await this.supabase!
      .from('conversations')
      .update({
        status: input.status,
        provider_used: input.provider_used,
        latest_message: input.latest_message ?? existing.latest_message ?? '',
        customer_name: input.customer_name ?? existing.customer_name ?? null,
        customer_email: input.customer_email ?? existing.customer_email ?? null,
        issue_category: input.issue_category ?? existing.issue_category ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Unable to update conversation: ${error.message}`);
    }

    return data as ConversationRecord;
  }

  private isUniqueSessionConstraintError(error: { code?: string; message: string }) {
    return (
      error.code === '23505' &&
      error.message.includes('conversations_session_id_key')
    );
  }
}
