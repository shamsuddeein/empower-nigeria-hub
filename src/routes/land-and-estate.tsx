import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/land-and-estate")({
  head: () => seo("Land and Estate", "Every plot comes with documents. We show them to you before you pay."),
  component: () => (
    <>
      <PageHeader title="Land and Estate">Every plot comes with documents. We show them to you before you pay.</PageHeader>
      <FinalCta topic="Land and Estate" />
    </>
  ),
});
