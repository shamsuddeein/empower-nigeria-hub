import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useState } from "react";
import { galleryQuery, testimonialsQuery } from "@/lib/data";
import { Photo, Skeleton } from "./ui";

export function Testimonials({ category, title = "What customers say" }: { category?: string; title?: string }) {
  const { data, isLoading } = useQuery(testimonialsQuery(category));
  if (isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    );
  if (!data?.length) return null;
  const [first, ...rest] = data;
  return (
    <div>
      <h2 className="mb-6 text-2xl font-extrabold md:text-3xl">{title}</h2>
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <figure className="border-l-4 border-action pl-5">
          <blockquote className="font-display text-2xl font-bold leading-snug text-navy md:text-3xl">“{first.quote}”</blockquote>
          <figcaption className="mt-4 text-muted-foreground">
            <span className="font-semibold text-foreground">{first.name}</span>, {first.business}, {first.state}
          </figcaption>
        </figure>
        <div className="divide-y border-y">
          {rest.slice(0, 3).map((t) => (
            <figure key={t.id} className="py-4">
              <blockquote>“{t.quote}”</blockquote>
              <figcaption className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{t.name}</span>, {t.business}, {t.state}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoEmbed({ url, label }: { url: string; label: string }) {
  const [on, setOn] = useState(false);
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)?.[1];
  if (on)
    return yt ? (
      <iframe className="aspect-video w-full rounded-lg" src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1`} title={label} allow="autoplay; encrypted-media" allowFullScreen />
    ) : (
      <video className="aspect-video w-full rounded-lg bg-foreground" src={url} controls autoPlay />
    );
  return (
    <button type="button" onClick={() => setOn(true)} className="flex aspect-video w-full items-center justify-center gap-3 rounded-lg bg-navy text-navy-foreground">
      <Play className="size-8" aria-hidden />
      <span className="font-semibold">Play video: {label}</span>
    </button>
  );
}

const fallback = [
  "Solar panels on a shop roof in Kano",
  "Inverter and batteries in a pure water factory",
  "Filling station lights at night on solar",
  "Phone charging stand powered by solar",
  "Technician wiring a battery bank",
];

export function Gallery({ category }: { category?: string }) {
  const { data } = useQuery(galleryQuery(category));
  const photos = (data ?? []).filter((g) => g.image);
  const video = (data ?? []).find((g) => g.video_url);
  const items = photos.length ? photos.map((p) => ({ label: p.caption ?? "Installation photo", src: p.image })) : fallback.map((label) => ({ label, src: null }));
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.slice(0, 5).map((p, i) => (
        <Photo key={i} label={p.label} src={p.src} ratio={i === 0 ? "aspect-square md:aspect-auto md:h-full" : "aspect-square"} className={i === 0 ? "col-span-2 row-span-2" : ""} />
      ))}
      <div className="col-span-2 md:col-span-4">
        {video?.video_url ? <VideoEmbed url={video.video_url} label={video.caption ?? "Installation"} /> : (
          <div className="flex aspect-[21/9] items-center justify-center rounded-lg border border-dashed border-input bg-muted text-sm text-muted-foreground">Video: a customer walks through their installation (added from admin)</div>
        )}
      </div>
    </div>
  );
}
