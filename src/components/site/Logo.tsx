import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import logoTransparent from "@/assets/logo-transparent.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  onNavy?: boolean;
  compact?: boolean;
  asLink?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  onNavy = false,
  compact = false,
  asLink = true,
  href = "/",
  className,
}: LogoProps) {
  const imageElement = (
    <div
      className={cn(
        "inline-flex items-center transition-opacity hover:opacity-95",
        onNavy && "rounded-md bg-white px-2 py-1 shadow-sm",
        className,
      )}
    >
      <img
        src={onNavy ? logoImg : logoTransparent}
        alt="S.i and Billionaires Hub Nig.Ltd"
        className={cn(
          "h-8 w-auto max-w-[180px] object-contain sm:h-9",
          !onNavy && "h-8 sm:h-9 lg:h-10",
        )}
        width={887}
        height={321}
        loading="eager"
      />
    </div>
  );

  if (!asLink) {
    return imageElement;
  }

  return (
    <Link
      to={href}
      className="inline-flex min-h-12 min-w-0 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-md"
      aria-label="S.i and Billionaires Hub Nig.Ltd, home"
    >
      {imageElement}
    </Link>
  );
}
