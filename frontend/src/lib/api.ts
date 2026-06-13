import type {
  AdminSession,
  ChatResponse,
  ConversationHistoryMessage,
  ConversationSummary,
  CreateTicketPayload,
  CustomerInfo,
  DashboardStats,
  SupportTicket
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

function withAdminHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

interface SendChatPayload {
  message: string;
  session_id: string;
  customer?: CustomerInfo;
  order_number?: string;
  checkout_email?: string;
}

async function handleJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? fallbackMessage);
  }

  return response.json() as Promise<T>;
}

export async function sendChatMessage(payload: SendChatPayload): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleJsonResponse<ChatResponse>(response, 'Unable to send message');
}

export async function fetchAdminSession(token: string): Promise<AdminSession> {
  const response = await fetch(`${API_BASE_URL}/admin/session`, {
    headers: withAdminHeaders(token)
  });

  return handleJsonResponse<AdminSession>(response, 'Unable to verify admin access');
}

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: withAdminHeaders(token)
  });

  return handleJsonResponse<DashboardStats>(response, 'Unable to load dashboard');
}

export async function fetchRecentConversations(token: string): Promise<ConversationSummary[]> {
  const response = await fetch(`${API_BASE_URL}/conversations/recent`, {
    headers: withAdminHeaders(token)
  });

  return handleJsonResponse<ConversationSummary[]>(response, 'Unable to load conversations');
}

export async function fetchConversationMessages(
  sessionId: string,
  token: string
): Promise<ConversationHistoryMessage[]> {
  const response = await fetch(`${API_BASE_URL}/conversations/${sessionId}/messages`, {
    headers: withAdminHeaders(token)
  });

  return handleJsonResponse<ConversationHistoryMessage[]>(
    response,
    'Unable to load conversation history'
  );
}

export async function createSupportTicket(payload: CreateTicketPayload): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleJsonResponse<ChatResponse>(response, 'Unable to create support ticket');
}

export async function updateSupportTicket(payload: {
  id: string;
  token: string;
  status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved';
  assignee?: string;
}): Promise<SupportTicket> {
  const response = await fetch(`${API_BASE_URL}/tickets/${payload.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...withAdminHeaders(payload.token)
    },
    body: JSON.stringify({
      status: payload.status,
      assignee: payload.assignee
    })
  });

  return handleJsonResponse<SupportTicket>(response, 'Unable to update support ticket');
}
