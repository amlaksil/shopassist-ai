import type { ChatMessage as Message } from '../types';
import { formatTimeOnly } from '../lib/insights';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.sender === 'assistant';

  return (
    <article
      aria-label={isAssistant ? 'Message from ShopAssist AI' : 'Your message'}
      className={`chat-message chat-message--${message.sender}`}
    >
      {isAssistant ? (
        <div className="chat-message__meta">
          <div className="chat-message__identity">
            <span className="chat-message__avatar" aria-hidden="true">
              SA
            </span>
            <div>
              <strong>ShopAssist AI</strong>
              <time dateTime={message.created_at}>{formatTimeOnly(message.created_at)}</time>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-message__meta chat-message__meta--user">
          <time className="chat-message__time" dateTime={message.created_at}>
            {formatTimeOnly(message.created_at)}
          </time>
        </div>
      )}

      <div className="chat-message__bubble">
        <p>{message.content}</p>
      </div>
    </article>
  );
}
