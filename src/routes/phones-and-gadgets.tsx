import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/phones-and-gadgets")({
  head: () => seo("Phones and Gadgets", "Phones, laptops and power banks paid weekly or monthly."),
  component: () => (
    <>
      <PageHeader title="Phones and Gadgets">Phones, laptops and power banks paid weekly or monthly.</PageHeader>
      <FinalCta topic="Phones and Gadgets" />
    </>
  ),
});
