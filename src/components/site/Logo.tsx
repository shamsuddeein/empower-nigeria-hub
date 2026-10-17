import { Link } from "@tanstack/react-router";

// To use the real logo: put the file in src/assets, import it here and render
// <img src={logo} alt="S.i and Billionaires Hub Nig.Ltd" width={160} height={48} /> instead of the mark + text.
export function Logo({ onNavy = false, compact = false }: { onNavy?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex min-h-12 min-w-0 items-center gap-2.5" aria-label="S.i and Billionaires Hub Nig.Ltd, home">
      <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" className="shrink-0">
        <rect width="40" height="40" rx="7" className={onNavy ? "fill-navy-foreground" : "fill-navy"} />
        <text x="20" y="29" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif" className={onNavy ? "fill-navy" : "fill-navy-foreground"}>
          $
        </text>
      </svg>
      {!compact && (
        <span className={`min-w-0 font-display text-sm font-bold leading-tight ${onNavy ? "text-navy-foreground" : "text-navy"}`}>
          S.i and Billionaires
          <br />
          Hub Nig.Ltd
        </span>
      )}
    </Link>
  );
}
