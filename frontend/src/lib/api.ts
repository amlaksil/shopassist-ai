import type {
  ChatResponse,
  CreateTicketPayload,
  CustomerInfo,
  DashboardStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

interface SendChatPayload {
  message: string;
  session_id: string;
  customer?: CustomerInfo;
}

export async function sendChatMessage(payload: SendChatPayload): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? 'Unable to send message');
  }

  return response.json() as Promise<ChatResponse>;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? 'Unable to load dashboard');
  }

  return response.json() as Promise<DashboardStats>;
}

export async function createSupportTicket(payload: CreateTicketPayload): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? 'Unable to create support ticket');
  }

  return response.json() as Promise<ChatResponse>;
}
