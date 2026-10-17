import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => seo("Questions and answers", "Plain answers about plans, payments and products."),
  component: () => (
    <>
      <PageHeader title="Questions and answers">Plain answers about plans, payments and products.</PageHeader>
      <FinalCta topic="Questions and answers" />
    </>
  ),
});
