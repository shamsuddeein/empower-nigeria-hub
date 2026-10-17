import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/agent-locator")({
  head: () => seo("Find an agent near you", "Approved agents across Northern Nigeria."),
  component: () => (
    <>
      <PageHeader title="Find an agent near you">Approved agents across Northern Nigeria.</PageHeader>
      <FinalCta topic="Find an agent near you" />
    </>
  ),
});
