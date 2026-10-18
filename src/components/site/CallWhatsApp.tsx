import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCompany } from "@/lib/data";
import { btn } from "./ui";

export function WhatsAppButton({
  topic,
  raw,
  variant = "secondary",
  children,
  className,
  fallbackText = "Contact Us",
}: {
  topic?: string;
  raw?: boolean;
  variant?: "secondary" | "primary" | "navy" | "onNavy" | "onAction";
  children?: ReactNode;
  className?: string;
  fallbackText?: string;
}) {
  const { wa, hasRealWhatsApp } = useCompany();
  if (!hasRealWhatsApp) {
    // Prevent misleading "Chat on WhatsApp" wording when WhatsApp is unavailable
    const isWaText =
      typeof children === "string" && /whatsapp/i.test(children);
    const displayText = isWaText ? fallbackText : (children ?? fallbackText);

    return (
      <a href="#enquire" className={btn({ variant, className })}>
        {displayText}
      </a>
    );
  }
  return (
    <a
      href={topic ? wa(topic, raw) : wa()}
      target="_blank"
      rel="noopener noreferrer"
      className={btn({ variant, className })}
    >
      {children ?? "Chat on WhatsApp"}
    </a>
  );
}

export function CallButton({
  variant = "secondary",
  className,
  children,
  fallbackText = "Contact Us",
}: {
  variant?: "secondary" | "navy" | "onNavy" | "primary";
  className?: string;
  children?: ReactNode;
  fallbackText?: string;
}) {
  const { tel, company, hasRealPhone } = useCompany();
  if (!hasRealPhone) {
    const isCallText =
      typeof children === "string" && /call/i.test(children);
    const displayText = isCallText ? fallbackText : (children ?? fallbackText);

    return (
      <a href="#enquire" className={btn({ variant, className })}>
        {displayText}
      </a>
    );
  }
  return (
    <a href={tel} className={btn({ variant, className })}>
      {children ?? `Call ${company.phone}`}
    </a>
  );
}

export function ContactUsButton({
  variant = "primary",
  className,
  children,
}: {
  variant?: "primary" | "secondary" | "navy" | "onNavy" | "onAction";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link to="/contact" className={btn({ variant, className })}>
      {children ?? "Contact Us"}
    </Link>
  );
}
