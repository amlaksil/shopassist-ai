import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { createSupportTicket, sendChatMessage } from '../lib/api';
import type { ChatMessage, ChatResponse, CustomerInfo } from '../types';
import { ChatMessage as ChatMessageCard } from './ChatMessage';
import { QuickActionButton } from './QuickActionButton';

const DEFAULT_SESSION_ID = `session_${crypto.randomUUID()}`;

const starterMessages: ChatMessage[] = [
  {
    id: crypto.randomUUID(),
    sender: 'assistant',
    content:
      'Hi, I’m ShopAssist AI. I can help with orders, shipping, returns, refunds, and account questions. If needed, I can pass this conversation to a support teammate so you will not need to repeat yourself.',
    created_at: new Date().toISOString(),
    status: 'answered'
  }
];

const quickActions = [
  {
    label: 'Track my order',
    prompt: 'Where is my order?'
  },
  {
    label: 'Start a return',
    prompt: 'I need help starting a return.'
  },
  {
    label: 'Ask about a refund',
    prompt: 'How do refunds work?'
  },
  {
    label: 'Shipping help',
    prompt: 'I need help with shipping.'
  },
  {
    label: 'Talk to support',
    prompt: 'I need help from a support teammate.'
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
  const [orderContext, setOrderContext] = useState({ orderNumber: '', email: '' });
  const [showOrderContext, setShowOrderContext] = useState(false);
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
  const hasOrderContext = useMemo(
    () => Boolean(orderContext.orderNumber.trim() || orderContext.email.trim()),
    [orderContext]
  );
  const isBusy = loading || ticketLoading;

  useEffect(() => {
    chatLogRef.current?.scrollTo({
      top: chatLogRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, latestMeta, loading, ticketLoading]);

  useEffect(() => {
    if (!latestMeta?.suggested_customer) {
      return;
    }

    setCustomer((current) => ({
      name: current.name ?? latestMeta.suggested_customer?.name,
      email: current.email ?? latestMeta.suggested_customer?.email,
      issue_summary: current.issue_summary ?? latestMeta.suggested_customer?.issue_summary
    }));
  }, [latestMeta]);

  async function submitMessage(content: string) {
    const trimmed = content.trim();
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
        customer,
        order_number: orderContext.orderNumber.trim() || undefined,
        checkout_email: orderContext.email.trim() || undefined
      });

      setLatestMeta(response);
      setMessages((current) => [...current, toAssistantMessage(response)]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  function clearOrderContext() {
    setOrderContext({ orderNumber: '', email: '' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(input);
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
        },
        ticket_context: latestMeta.ticket_context
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

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(input);
    }
  }

  return (
    <main className="customer-page">
      <header className="customer-page__hero">
        <div className="customer-page__hero-copy">
          <p className="customer-page__eyebrow">Customer Support</p>
          <h1>How can we help today?</h1>
          <p>
            Get quick help with orders, shipping, returns, and refunds. If something needs extra
            care, we can connect you with a support teammate.
          </p>
        </div>
      </header>

      <section className="customer-page__notice" aria-label="Support reassurance">
        If needed, your conversation can be passed to support so you do not need to repeat your
        issue.
      </section>

      <section className="customer-chat-card">
        <header className="customer-chat-card__header">
          <div className="customer-chat-card__identity">
            <span className="customer-chat-card__avatar" aria-hidden="true">
              SA
            </span>
            <div>
              <h2>ShopAssist AI</h2>
              <p>Tell us what you need help with.</p>
            </div>
          </div>
        </header>

        <div className="chat-toolbar" aria-label="Suggested customer requests">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              label={action.label}
              onClick={() => void submitMessage(action.prompt)}
            />
          ))}
        </div>

        <section className="customer-context-card" aria-label="Optional order details">
          <div className="customer-context-card__header">
            <div>
              <h3>Order question?</h3>
              <p>
                If your question is about an order, you can add your order number or checkout
                email here. The assistant will use it when helpful.
              </p>
            </div>
            <button
              className="secondary-button"
              onClick={() => setShowOrderContext((current) => !current)}
              type="button"
            >
              {showOrderContext ? 'Hide order details' : 'Add order details'}
            </button>
          </div>

          {hasOrderContext ? (
            <div className="customer-context-card__summary" role="status">
              <span>
                {orderContext.orderNumber.trim()
                  ? `Using order ${orderContext.orderNumber.trim()}`
                  : 'Using your checkout email'}
              </span>
              <button className="customer-context-card__clear" onClick={clearOrderContext} type="button">
                Clear
              </button>
            </div>
          ) : null}

          {showOrderContext ? (
            <div className="customer-context-card__form">
              <label>
                Order number
                <input
                  onChange={(event) =>
                    setOrderContext((current) => ({
                      ...current,
                      orderNumber: event.target.value
                    }))
                  }
                  placeholder="ORD-1001"
                  type="text"
                  value={orderContext.orderNumber}
                />
              </label>
              <label>
                Checkout email
                <input
                  onChange={(event) =>
                    setOrderContext((current) => ({
                      ...current,
                      email: event.target.value
                    }))
                  }
                  placeholder="name@example.com"
                  type="email"
                  value={orderContext.email}
                />
              </label>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="status-banner status-banner--error" role="alert">
            {error}
          </div>
        ) : null}

        <div aria-busy={isBusy} aria-live="polite" className="chat-log" ref={chatLogRef} role="log">
          {messages.map((message) => (
            <ChatMessageCard key={message.id} message={message} />
          ))}

          {isBusy ? (
            <div className="typing-indicator" aria-live="polite">
              <span className="typing-indicator__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <div>
                <strong>Preparing a reply</strong>
                <p>We will keep the conversation together if a support teammate joins.</p>
              </div>
            </div>
          ) : null}
        </div>

        {latestMeta?.requires_customer_details ? (
          <form className="customer-card" onSubmit={handleCreateTicket}>
            <div className="customer-card__header">
              <div>
                <h3>Share a few details</h3>
                <p>
                  We can open a support request for you and include this conversation so you do not
                  need to start over.
                </p>
              </div>
            </div>

            {needsCustomerFields.length > 0 ? (
              <p className="customer-card__hint">
                Still needed: {needsCustomerFields.map((field) => field.replace('_', ' ')).join(', ')}
              </p>
            ) : null}

            <div className="customer-grid">
              <label>
                Name
                <input
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Jamie Rivera"
                  type="text"
                  value={customer.name ?? ''}
                />
              </label>
              <label>
                Email
                <input
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="jamie@example.com"
                  type="email"
                  value={customer.email ?? ''}
                />
              </label>
              <label className="customer-grid__full">
                What do you need help with?
                <textarea
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      issue_summary: event.target.value
                    }))
                  }
                  placeholder="My order arrived damaged and I would like help with a refund."
                  rows={4}
                  value={customer.issue_summary ?? ''}
                />
              </label>
            </div>

            <div className="customer-actions">
              <button className="primary-button" disabled={!canCreateTicket || isBusy} type="submit">
                {ticketLoading ? 'Sending your request...' : 'Send to support'}
              </button>
              <span>Your support request will include the chat so you do not need to repeat anything.</span>
            </div>
          </form>
        ) : null}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <textarea
            id="chat-message"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Tell us what you need help with."
            rows={4}
            value={input}
          />
          <div className="chat-composer__footer">
            <p>Press Enter to send. Use Shift + Enter for a new line.</p>
            <button className="primary-button" disabled={isBusy || !input.trim()} type="submit">
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
