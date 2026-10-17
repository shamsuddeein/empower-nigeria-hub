import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { useCompany } from "@/lib/data";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav";
import { btn } from "./ui";

/** Mobile bottom bar (Call + WhatsApp) and desktop floating WhatsApp button. Hidden on /apply. */
export function ContactBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { wa, tel } = useCompany();
  if (path.startsWith("/apply")) return null;
  const topic = primaryNav.find((n) => path.startsWith(n.to))?.label ?? "your products and payment plans";
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <a href={tel} className={btn({ variant: "secondary" })}><Phone className="size-5" aria-hidden />Call us</a>
        <a href={wa(topic)} target="_blank" rel="noopener noreferrer" className={btn({ variant: "primary" })}><MessageCircle className="size-5" aria-hidden />WhatsApp</a>
      </div>
      <a href={wa(topic)} target="_blank" rel="noopener noreferrer" className={cn(btn({ variant: "primary" }), "fixed bottom-6 right-6 z-30 hidden shadow-lg md:inline-flex")}>
        <MessageCircle className="size-5" aria-hidden />WhatsApp
      </a>
    </>
  );
}

export function useHasContactBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return !path.startsWith("/apply") && !path.startsWith("/admin");
}
