import { type ServiceImageMeta, siteImages, type SiteImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

interface ServiceImageProps {
  imageKey?: SiteImageKey;
  image?: ServiceImageMeta;
  priority?: boolean;
  className?: string;
  showCaption?: boolean;
}

export function ServiceImage({
  imageKey,
  image: explicitImage,
  priority = false,
  className,
  showCaption = true,
}: ServiceImageProps) {
  const meta: ServiceImageMeta = explicitImage ?? (imageKey ? siteImages[imageKey] : siteImages.hero);

  return (
    <figure className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-sm", className)}>
      <div className="relative overflow-hidden bg-muted">
        <img
          src={meta.src}
          srcSet={meta.srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          alt={meta.alt}
          width={meta.width}
          height={meta.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 via-transparent to-transparent p-3 sm:hidden" />
      </div>

      {showCaption && (
        <figcaption className="border-t border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{meta.caption}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/80 leading-normal">
            <span className="font-semibold text-action">Notice:</span> {meta.attribution}
          </p>
        </figcaption>
      )}
    </figure>
  );
}
