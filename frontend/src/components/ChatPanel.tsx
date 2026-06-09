import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { createSupportTicket, sendChatMessage } from '../lib/api';
import type { ChatMessage, ChatResponse, CustomerInfo } from '../types';

const DEFAULT_SESSION_ID = `session_${crypto.randomUUID()}`;

const starterMessages: ChatMessage[] = [
  {
    id: crypto.randomUUID(),
    sender: 'assistant',
    content:
      'Hi, I am ShopAssist AI. I can help with shipping, returns, refunds, products, and account issues.',
    created_at: new Date().toISOString(),
    status: 'answered'
  }
];

function toAssistantMessage(response: ChatResponse): ChatMessage {
  return {
    id: crypto.randomUUID(),
    sender: 'assistant',
    content: response.answer,
    created_at: new Date().toISOString(),
    status: response.status
  };
}

export function ChatPanel() {
  const [sessionId] = useState(DEFAULT_SESSION_ID);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [customer, setCustomer] = useState<CustomerInfo>({});
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestMeta, setLatestMeta] = useState<ChatResponse | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  const needsCustomerFields = useMemo(
    () => latestMeta?.missing_customer_fields ?? [],
    [latestMeta]
  );
  const canCreateTicket = useMemo(
    () =>
      Boolean(customer.name?.trim()) &&
      Boolean(customer.email?.trim()) &&
      Boolean(customer.issue_summary?.trim()),
    [customer]
  );
  const isBusy = loading || ticketLoading;

  useEffect(() => {
    chatLogRef.current?.scrollTo({
      top: chatLogRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, latestMeta, loading, ticketLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isBusy) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: trimmed,
      created_at: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage({
        message: trimmed,
        session_id: sessionId,
        customer
      });

      setLatestMeta(response);
      setMessages((current) => [...current, toAssistantMessage(response)]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!latestMeta?.requires_customer_details || !canCreateTicket || isBusy) {
      return;
    }

    setTicketLoading(true);
    setError(null);

    try {
      const response = await createSupportTicket({
        session_id: sessionId,
        issue_category: latestMeta.category,
        customer: {
          name: customer.name!.trim(),
          email: customer.email!.trim(),
          issue_summary: customer.issue_summary!.trim()
        }
      });

      setLatestMeta(response);
      setMessages((current) => [...current, toAssistantMessage(response)]);
      setCustomer({});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
    } finally {
      setTicketLoading(false);
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Customer Support Chat</p>
          <h2>Live storefront assistant</h2>
        </div>
        <span className="session-chip">{sessionId.slice(0, 18)}</span>
      </div>

      <div className="chat-log" ref={chatLogRef}>
        {messages.map((message) => (
          <article
            key={message.id}
            className={`message-bubble message-bubble--${message.sender}`}
          >
            <span>{message.content}</span>
            <small>{new Date(message.created_at).toLocaleTimeString()}</small>
          </article>
        ))}

        {isBusy ? <div className="message-bubble message-bubble--assistant">Processing...</div> : null}
      </div>

      {latestMeta?.requires_customer_details ? (
        <form className="customer-card" onSubmit={handleCreateTicket}>
          <h3>Support ticket details</h3>
          <p>
            Share the details below to open a support ticket. Press the button when ready.
          </p>
          {needsCustomerFields.length > 0 ? (
            <p className="customer-card__hint">Missing: {needsCustomerFields.join(', ')}</p>
          ) : null}
          <div className="customer-grid">
            <label>
              Name
              <input
                value={customer.name ?? ''}
                onChange={(event) =>
                  setCustomer((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Jamie Rivera"
              />
            </label>
            <label>
              Email
              <input
                value={customer.email ?? ''}
                onChange={(event) =>
                  setCustomer((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="jamie@example.com"
                type="email"
              />
            </label>
            <label className="customer-grid__full">
              Issue summary
              <textarea
                value={customer.issue_summary ?? ''}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    issue_summary: event.target.value
                  }))
                }
                placeholder="My refund request needs manual review."
              />
            </label>
          </div>
          <div className="customer-actions">
            <button disabled={!canCreateTicket || isBusy} type="submit">
              {ticketLoading ? 'Creating ticket...' : 'Create support ticket'}
            </button>
            <span>Press Enter in the name or email field to submit once all details are filled.</span>
          </div>
        </form>
      ) : null}

      {error ? <div className="status-banner status-banner--error">{error}</div> : null}

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about shipping, returns, orders, payments, or products."
          rows={3}
        />
        <button disabled={isBusy || !input.trim()} type="submit">
          {loading ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </section>
  );
}
