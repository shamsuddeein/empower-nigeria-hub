import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About us", "Who we are and how we work."),
  component: () => (
    <>
      <PageHeader title="About us">Who we are and how we work.</PageHeader>
      <FinalCta topic="About us" />
    </>
  ),
});
