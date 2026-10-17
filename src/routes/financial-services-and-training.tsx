import { createFileRoute } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/financial-services-and-training")({
  head: () => seo("Financial Services and Training", "POS setup, BVN and NIN enrollment, consultancy and hands-on courses."),
  component: () => (
    <>
      <PageHeader title="Financial Services and Training">POS setup, BVN and NIN enrollment, consultancy and hands-on courses.</PageHeader>
      <FinalCta topic="Financial Services and Training" />
    </>
  ),
});
