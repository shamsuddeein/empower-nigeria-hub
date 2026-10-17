import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact us", "Call, WhatsApp or visit our office."),
  component: () => (
    <>
      <PageHeader title="Contact us">Call, WhatsApp or visit our office.</PageHeader>
      <FinalCta topic="Contact us" />
    </>
  ),
});
