import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InlineSpinner } from '../components/Loader';

const DEMO_CREDS = [
  {
    role: 'buyer',
    email: 'buyer@demo.com',
    password: 'buyer123',
    label: 'Buyer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    desc: 'Browse catalog, track orders & returns',
  },
  {
    role: 'seller',
    email: 'seller@demo.com',
    password: 'seller123',
    label: 'Seller',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    desc: 'Manage listings, inventory & deliveries',
  },
  {
    role: 'admin',
    email: 'admin@demo.com',
    password: 'admin123',
    label: 'Admin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    desc: 'Fraud center, fleet & operations',
  },
];

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Full name is required');
        await register(email, password, name, role);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (cred: typeof DEMO_CREDS[0]) => {
    setError('');
    setSubmitting(true);
    try {
      await login(cred.email, cred.password);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Top bar */}
      <header className="lp-topbar">
        <div className="lp-logo">
          <div className="lp-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <span className="lp-logo-name">SecondLife <span className="lp-logo-accent">Commerce</span></span>
        </div>
      </header>

      {/* Centered card */}
      <main className="lp-main">
        <div className="lp-card">

          {/* Card header */}
          <div className="lp-card-header">
            <h1 className="lp-title">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </h1>
            <p className="lp-subtitle">
              {mode === 'login'
                ? 'Enter your credentials or use a demo account below.'
                : 'Fill in the details to get started on SecondLife Commerce.'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="lp-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              className={`lp-tab${mode === 'login' ? ' lp-tab--active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              className={`lp-tab${mode === 'register' ? ' lp-tab--active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {/* Demo quick-access — login mode only */}
          {mode === 'login' && (
            <div className="lp-demo-section">
              <p className="lp-demo-label">Quick demo access</p>
              <div className="lp-demo-row">
                {DEMO_CREDS.map(cred => (
                  <button
                    key={cred.role}
                    className="lp-demo-btn"
                    onClick={() => handleDemoLogin(cred)}
                    disabled={submitting}
                    title={cred.desc}
                  >
                    <span className="lp-demo-icon">{cred.icon}</span>
                    <span className="lp-demo-label-text">{cred.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="lp-divider"><span>or continue with email</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="lp-form" noValidate>
            {mode === 'register' && (
              <div className="lp-field">
                <label htmlFor="lp-name">Full Name</label>
                <input
                  id="lp-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="lp-field">
              <label htmlFor="lp-email">Email address</label>
              <input
                id="lp-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="lp-field">
              <label htmlFor="lp-password">Password</label>
              <div className="lp-pw-wrap">
                <input
                  id="lp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="lp-field">
                <label htmlFor="lp-role">Account type</label>
                <select id="lp-role" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="buyer">Buyer — Browse catalog & track orders</option>
                  <option value="seller">Seller — Manage listings & inventory</option>
                  <option value="admin">Admin — Operations & fraud management</option>
                </select>
              </div>
            )}

            {error && (
              <div className="lp-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="lp-submit"
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <>
                  <InlineSpinner size={14} color="#0F1111" />
                  Processing...
                </>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="lp-switch">
            {mode === 'login'
              ? <>Don't have an account?{' '}<button className="lp-link" onClick={() => { setMode('register'); setError(''); }}>Register here</button></>
              : <>Already have an account?{' '}<button className="lp-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
            }
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        SecondLife Commerce &copy; {new Date().getFullYear()} &mdash; AI-Powered Circular Returns Platform
      </footer>
    </div>
  );
}
