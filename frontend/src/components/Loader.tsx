/**
 * SecondLife Commerce — Unified Loading Components
 *
 * Usage:
 *   <PageLoader />                   — full-screen auth/initial load
 *   <SectionLoader label="..." />    — inside a view panel
 *   <InlineSpinner />                — inside a button or small area
 *   <SkeletonCard />                 — placeholder card while catalog loads
 *   <SkeletonRow />                  — placeholder table row
 *   <SkeletonKPI />                  — placeholder KPI tile
 */

import './Loader.css';

/* ── Full-page loader (auth / app boot) ───────────────────── */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="sl-page-loader">
      <div className="sl-page-loader__inner">
        <div className="sl-logo-spin">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div className="sl-page-loader__track">
          <div className="sl-page-loader__bar" />
        </div>
        <p className="sl-page-loader__label">{label}</p>
      </div>
    </div>
  );
}

/* ── Section loader (inside a view, replaces content) ─────── */
export function SectionLoader({ label = 'Loading data…', height = 280 }: { label?: string; height?: number }) {
  return (
    <div className="sl-section-loader" style={{ minHeight: height }}>
      <div className="sl-orbit">
        <div className="sl-orbit__ring" />
        <div className="sl-orbit__dot" />
      </div>
      <p className="sl-section-loader__label">{label}</p>
    </div>
  );
}

/* ── Inline spinner (inside buttons, small spaces) ───────────*/
export function InlineSpinner({ size = 16, color = '#131A22' }: { size?: number; color?: string }) {
  return (
    <span
      className="sl-inline-spinner"
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Loading"
    />
  );
}

/* ── Skeleton card (catalog / product grids) ──────────────── */
export function SkeletonCard() {
  return (
    <div className="sl-skel-card">
      <div className="sl-skel sl-skel-img" />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div className="sl-skel sl-skel-h3" />
        <div className="sl-skel sl-skel-h4" style={{ width: '60%' }} />
        <div className="sl-skel sl-skel-text" />
        <div className="sl-skel sl-skel-btn" />
      </div>
    </div>
  );
}

/* ── Skeleton table row ───────────────────────────────────── */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="sl-skel-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.85rem 1rem' }}>
          <div className="sl-skel" style={{ height: 14, borderRadius: 4, width: i === 0 ? '80%' : i === cols - 1 ? '40%' : '65%' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Skeleton KPI tile ────────────────────────────────────── */
export function SkeletonKPI() {
  return (
    <div className="sl-skel-kpi">
      <div className="sl-skel" style={{ height: 32, width: '50%', borderRadius: 6, marginBottom: '0.5rem' }} />
      <div className="sl-skel" style={{ height: 12, width: '70%', borderRadius: 4 }} />
    </div>
  );
}

/* ── Empty state (no data, not loading) ───────────────────── */
export function EmptyState({ title = 'No data', message = 'Nothing to display right now.', icon }: {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="sl-empty">
      {icon && <div className="sl-empty__icon">{icon}</div>}
      <h3 className="sl-empty__title">{title}</h3>
      <p className="sl-empty__message">{message}</p>
    </div>
  );
}
