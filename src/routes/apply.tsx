import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { WhatsAppButton } from "@/components/site/CallWhatsApp";
import { PageHeader } from "@/components/site/ui";
import { seo } from "@/lib/seo";

const search = z.object({
  category: z.string().optional(),
  product: z.string().optional(),
  price: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  frequency: z.enum(["weekly", "monthly"]).optional(),
});

export const Route = createFileRoute("/apply")({
  validateSearch: (s) => search.parse(s),
  head: () => seo("Apply for a payment plan", "Apply for solar, an electric vehicle, a phone or land on weekly or monthly payments."),
  component: () => (
    <>
      <PageHeader title="Apply for a payment plan">The online form is being finished. Message us on WhatsApp to apply now.</PageHeader>
      <div className="container-site py-10"><WhatsAppButton topic="applying for a payment plan" /></div>
    </>
  ),
});
