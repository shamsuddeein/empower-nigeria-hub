import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useCompany } from "@/lib/data";
import { btn } from "./ui";

export function WhatsAppButton({ topic, raw, variant = "secondary", children, className }: { topic: string; raw?: boolean; variant?: "secondary" | "primary" | "navy" | "onNavy" | "onAction"; children?: ReactNode; className?: string }) {
  const { wa } = useCompany();
  return (
    <a href={wa(topic, raw)} target="_blank" rel="noopener noreferrer" className={btn({ variant, className })}>
      <MessageCircle className="size-5" aria-hidden />
      {children ?? "Chat on WhatsApp"}
    </a>
  );
}

export function CallButton({ variant = "secondary", className, children }: { variant?: "secondary" | "navy" | "onNavy" | "primary"; className?: string; children?: ReactNode }) {
  const { tel, company } = useCompany();
  return (
    <a href={tel} className={btn({ variant, className })}>
      <Phone className="size-5" aria-hidden />
      {children ?? `Call ${company.phone}`}
    </a>
  );
}

/** Final call to action block used at the bottom of pages. */
export function FinalCta({ title = "Ready to start?", topic, text }: { title?: string; topic: string; text?: string }) {
  const { company, tel } = useCompany();
  return (
    <section className="py-14 md:py-20">
      <div className="container-site grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <h2 className="text-3xl font-extrabold md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            {text ?? "Fill the short form and we will call you within one working day. Or speak to us now on "}
            {!text && <a href={tel} className="font-semibold text-navy underline">{company.phone}</a>}
            {!text && "."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Link to="/apply" className={btn({ size: "lg" })}>Apply Now</Link>
          <WhatsAppButton topic={topic} />
        </div>
      </div>
    </section>
  );
}
