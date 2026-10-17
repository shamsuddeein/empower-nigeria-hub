import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/become-an-agent")({
  head: () => seo("Become an agent or ambassador", "Sell or refer customers in your town and earn commission."),
  component: () => (
    <>
      <PageHeader title="Become an agent or ambassador">Sell or refer customers in your town and earn commission.</PageHeader>
      <FinalCta topic="Become an agent or ambassador" />
    </>
  ),
});
