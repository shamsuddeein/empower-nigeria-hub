import { cn } from "@/lib/utils";

interface ProductImagePlaceholderProps {
  category?: string;
  productName: string;
  className?: string;
}

export function ProductImagePlaceholder({
  category = "general",
  productName,
  className,
}: ProductImagePlaceholderProps) {
  const getCategoryDetails = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "solar":
        return {
          tag: "Solar Hardware",
          icon: (
            <svg className="size-7 text-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ),
          accent: "border-border bg-surface-muted/60",
        };
      case "ev":
        return {
          tag: "Electric Vehicle",
          icon: (
            <svg className="size-7 text-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ),
          accent: "border-border bg-surface-muted/60",
        };
      case "phones":
      case "gadgets":
      case "laptops":
      case "pos":
        return {
          tag: "Tech Hardware",
          icon: (
            <svg className="size-7 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          ),
          accent: "border-border bg-surface-muted/60",
        };
      default:
        return {
          tag: "Equipment Inventory",
          icon: (
            <svg className="size-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          ),
          accent: "border-border bg-surface-muted/60",
        };
    }
  };

  const details = getCategoryDetails(category);

  return (
    <div
      role="img"
      aria-label={`Photo coming soon for ${productName}`}
      className={cn(
        "flex flex-col items-center justify-between rounded-lg border border-border/80 p-3 text-center aspect-[2.2/1] sm:aspect-[2/1] transition-colors",
        details.accent,
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground border border-border">
          Photo coming soon
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {details.tag}
        </span>
      </div>

      <div className="my-1 flex flex-col items-center gap-1">
        <div className="rounded-full bg-background p-1.5 shadow-xs border border-border">
          {details.icon}
        </div>
        <p className="text-xs font-semibold text-foreground line-clamp-1">
          {productName}
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-tight">
        Hardware specifications and verified details listed below.
      </p>
    </div>
  );
}

interface PlotImagePlaceholderProps {
  estateName: string;
  town?: string;
  state?: string;
  className?: string;
}

export function PlotImagePlaceholder({
  estateName,
  town,
  state = "Kaduna",
  className,
}: PlotImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Plot location reference for ${estateName}`}
      className={cn(
        "flex flex-col justify-between rounded-lg border border-border/80 bg-surface-muted/60 p-3 aspect-[2.2/1] sm:aspect-[2/1]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-background px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground border border-border">
          Location Reference
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {town ? `${town}, ` : ""}{state}
        </span>
      </div>

      <div className="my-1.5 flex items-center justify-center gap-2.5">
        <svg className="size-6 text-action/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.284a2.25 2.25 0 0 0-2.012 0L2.616 5.722A1.125 1.125 0 0 0 2 6.728v12.353c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
        </svg>
        <div className="text-left">
          <p className="text-xs font-bold text-navy">{estateName}</p>
          <p className="text-[10px] text-muted-foreground">Plot Layout & Location Plan</p>
        </div>
      </div>

      <div className="border-t border-border/80 pt-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Site details available on enquiry</span>
        <span className="font-medium text-action">Physical inspection available</span>
      </div>
    </div>
  );
}
