import React from "react";

interface ProductGridSkeletonProps {
  columns?: number;
  rows?: number;
}

export function ProductGridSkeleton({ columns = 3, rows = 2 }: ProductGridSkeletonProps) {
  const cards = Array.from({ length: columns * rows }, (_, idx) => idx);
  return (
    <div
      className="skeleton-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {cards.map((key) => (
        <div key={key} className="skeleton-card">
          <div className="skeleton skeleton-card-media" />
          <div className="skeleton skeleton-card-line skeleton-card-line--short" />
          <div className="skeleton skeleton-card-line" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="skeleton-hero" aria-hidden>
      <div className="skeleton skeleton-hero-title" />
      <div className="skeleton skeleton-hero-subtitle" />
      <div className="skeleton skeleton-hero-line" />
      <div className="skeleton skeleton-hero-line skeleton-hero-line--short" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-skeleton" aria-hidden>
      <HeroSkeleton />
      <div className="detail-skeleton-copy">
        <div className="skeleton skeleton-detail-line" />
        <div className="skeleton skeleton-detail-line" />
        <div className="skeleton skeleton-detail-line skeleton-detail-line--short" />
        <div className="skeleton skeleton-detail-line" />
      </div>
    </div>
  );
}

interface RouteLoadingShellProps {
  title?: string;
  message?: string;
  grid?: boolean;
  rows?: number;
  columns?: number;
}

export function RouteLoadingShell({
  title,
  message,
  grid = true,
  rows = 2,
  columns = 3,
}: RouteLoadingShellProps) {
  return (
    <section className="route-loading-shell">
      {title && <p className="route-loading-title">{title}</p>}
      <MicroLoadingIndicator label={message || "Calming your ritual"} />
      {grid ? (
        <ProductGridSkeleton columns={columns} rows={rows} />
      ) : (
        <HeroSkeleton />
      )}
    </section>
  );
}

interface MicroLoadingIndicatorProps {
  label?: string;
}

export function MicroLoadingIndicator({ label }: MicroLoadingIndicatorProps) {
  return (
    <div className="micro-loading-indicator" aria-live="polite">
      <div className="micro-loading-dots" />
      {label && <span>{label}</span>}
    </div>
  );
}
