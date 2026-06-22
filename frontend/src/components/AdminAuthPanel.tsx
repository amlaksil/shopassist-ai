/*
 * Sign-in surface for approved support accounts before they can open the admin workspace.
 */
import { FormEvent, useState } from 'react';

type AdminAuthMode = 'sign_in' | 'sign_up';
type AdminAuthPanelStatus = 'loading' | 'signed_out' | 'ready' | 'forbidden' | 'error';

interface AdminAuthPanelProps {
  status: AdminAuthPanelStatus;
  message: string | null;
  allowSignUp: boolean;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function AdminAuthPanel({
  status,
  message,
  allowSignUp,
  onSignIn,
  onSignUp,
  onSignOut
}: AdminAuthPanelProps) {
  const [mode, setMode] = useState<AdminAuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLocalMessage('Enter your approved support email and a password.');
      return;
    }

    try {
      setLoading(true);
      setLocalMessage(null);

      if (mode === 'sign_up' && allowSignUp) {
        await onSignUp(email.trim(), password);
      } else {
        await onSignIn(email.trim(), password);
      }
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : 'Unable to continue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="admin-auth-card__copy">
          <p className="admin-auth-card__eyebrow">Support workspace</p>
          <h1>Sign in to open the admin dashboard</h1>
          <p>
            Customer conversations, tickets, and support history are only available to approved
            team accounts.
          </p>
        </div>

        <div className="admin-auth-card__notice">
          <strong>Approved support accounts only</strong>
          <span>Sign in with an allowlisted support email that has already been provisioned.</span>
        </div>

        {status === 'loading' ? (
          <div className="admin-auth-card__state">
            <strong>Checking your admin access</strong>
            <span>One moment while we verify your support account.</span>
          </div>
        ) : (
          <form className="admin-auth-form" onSubmit={handleSubmit}>
            {allowSignUp ? (
              <div className="admin-auth-form__toggle" role="tablist" aria-label="Admin access mode">
                <button
                  aria-selected={mode === 'sign_in'}
                  className={`admin-auth-form__toggle-item ${mode === 'sign_in' ? 'is-active' : ''}`}
                  onClick={() => setMode('sign_in')}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  aria-selected={mode === 'sign_up'}
                  className={`admin-auth-form__toggle-item ${mode === 'sign_up' ? 'is-active' : ''}`}
                  onClick={() => setMode('sign_up')}
                  type="button"
                >
                  Create account
                </button>
              </div>
            ) : null}

            <label>
              Support email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@support-team.com"
                type="email"
                value={email}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type="password"
                value={password}
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading
                ? 'Please wait'
                : mode === 'sign_up' && allowSignUp
                  ? 'Create support account'
                  : 'Open admin dashboard'}
            </button>
          </form>
        )}

        {!allowSignUp ? (
          <div className="admin-auth-card__helper" role="status">
            New admin accounts should be provisioned through Supabase Auth or an approved invite
            flow before sign-in.
          </div>
        ) : null}

        {status === 'forbidden' ? (
          <div className="admin-auth-card__state admin-auth-card__state--warning">
            <strong>This email is not on the support allowlist</strong>
            <span>Use an approved support email or update the local allowlist table.</span>
            <button className="secondary-button" onClick={() => void onSignOut()} type="button">
              Sign out
            </button>
          </div>
        ) : null}

        {status === 'error' && message ? (
          <div className="status-banner status-banner--error" role="alert">
            {message}
          </div>
        ) : null}

        {status !== 'error' && localMessage ? (
          <div className="status-banner status-banner--error" role="alert">
            {localMessage}
          </div>
        ) : null}

        {status !== 'error' && !localMessage && message ? (
          <div className="admin-auth-card__helper" role="status">
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}
