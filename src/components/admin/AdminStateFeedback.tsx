import type { ReactNode } from "react";

interface AdminLoadingStateProps {
  message?: string | undefined;
}

export function AdminLoadingState({ message = "Loading records..." }: AdminLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="py-16 text-center rounded-xl border border-border bg-surface shadow-xs space-y-3"
    >
      <div className="inline-block w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
      <p className="text-sm font-semibold text-navy">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}

interface AdminErrorStateProps {
  title?: string | undefined;
  message?: string | undefined;
  onRetry: () => void;
  isRetrying?: boolean | undefined;
}

export function AdminErrorState({
  title = "Failed to load data",
  message = "An error occurred while fetching information from the server.",
  onRetry,
  isRetrying = false,
}: AdminErrorStateProps) {
  return (
    <div
      role="alert"
      className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-3 shadow-xs"
    >
      <div className="w-10 h-10 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold text-lg">
        !
      </div>
      <h3 className="font-bold text-base text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
      <div className="pt-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="min-h-[44px] px-5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {isRetrying ? "Retrying..." : "Retry Loading"}
        </button>
      </div>
    </div>
  );
}

interface AdminEmptyStateProps {
  title?: string | undefined;
  description?: string | undefined;
  message?: string | undefined;
  action?: ReactNode | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

export function AdminEmptyState({
  title = "No records found",
  description,
  message,
  action,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  const effectiveDesc = description ?? message ?? "No items match your selected filter or criteria.";
  return (
    <div className="py-16 text-center rounded-xl border border-border bg-surface shadow-xs space-y-2">
      <p className="font-bold text-base text-navy">{title}</p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">{effectiveDesc}</p>
      {action && <div className="pt-3">{action}</div>}
      {!action && actionLabel && onAction && (
        <div className="pt-3">
          <button
            type="button"
            onClick={onAction}
            className="min-h-[44px] px-5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
