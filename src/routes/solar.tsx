import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { InstallmentCalculator } from "@/components/site/InstallmentCalculator";
import { Gallery, Testimonials } from "@/components/site/Proof";
import { btn, PageHeader, Photo, Section, Skeleton } from "@/components/site/ui";
import { supabase } from "@/integrations/supabase/client";
import { useMarkups } from "@/lib/data";
import { naira } from "@/lib/format";
import { calculatePlan } from "@/lib/installments";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/solar")({
  head: () => seo("Solar for Business", "Solar systems for phone charging, filling stations, pure water factories and shops. No deposit, weekly or monthly payments."),
  component: SolarPage,
});

const businesses = [
  { name: "Phone charging", who: "Charging points and kiosks running a small generator all day.", size: "Small system: 4 panels, 5kWh battery (example)", replaces: "A 1.5kVA petrol generator and about 4 litres of fuel a day", saving: "About ₦70,000 a month (example)", photo: "phone charging stand on solar", slug: "solar-small" },
  { name: "Filling stations", who: "Stations that run pumps and lights from a diesel generator.", size: "Large system: 16 panels, 20kWh battery (example)", replaces: "A diesel generator for pumps, lights and the office", saving: "About ₦350,000 a month (example)", photo: "filling station canopy with solar panels", slug: "solar-large" },
  { name: "Pure water factories", who: "Sachet water producers with a pump, sealing machine and UV.", size: "Large system: 16 panels, 20kWh battery (example)", replaces: "Daily diesel for the pump and sealers", saving: "About ₦280,000 a month (example)", photo: "pure water sealing machine running on solar", slug: "solar-large" },
  { name: "Shops and markets", who: "Provision shops, salons and cold rooms with freezers.", size: "Medium system: 8 panels, 10kWh battery (example)", replaces: "A 2.5kVA generator and evening fuel", saving: "About ₦120,000 a month (example)", photo: "provision shop with a freezer on solar", slug: "solar-medium" },
];

const faqs = [
  ["Who owns the system during the payment period?", "We do, until your last payment. After that it is fully yours and we give you a written letter of ownership."],
  ["What happens if I miss a payment?", "Call us before the date. We will agree a new date. If payments stop for a long time without contact, we may switch the system off remotely and then remove it."],
  ["Is there a warranty?", "Yes. Panels carry 10 years, batteries 5 years and inverters 2 years from the maker. We handle claims for you."],
  ["Who maintains it?", "We do. A technician visits every three months during the plan, and within 48 hours if there is a fault."],
  ["What do I need to apply?", "Only the short online form. When we call, we will tell you which documents to bring, usually an ID and a guarantor."],
];

function SolarPage() {
  const markups = useMarkups();
  const { data: packages, isLoading } = useQuery({
    queryKey: ["products", "solar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("category", "solar").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const bySlug = (s: string) => packages?.find((p) => p.slug === s);

  return (
    <>
      <PageHeader eyebrow="Solar" title="Solar for Business">
        Stop buying fuel daily. Pay for your own power in small installments, with no deposit.
      </PageHeader>

      <Section>
        <h2 className="text-3xl font-extrabold">Who we install for</h2>
        <div className="mt-8 space-y-12 md:space-y-16">
          {businesses.map((b, i) => {
            const p = bySlug(b.slug);
            return (
              <article key={b.name} className="grid gap-6 md:grid-cols-2 md:items-center">
                <Photo label={b.photo} className={i % 2 ? "md:order-2" : ""} />
                <div>
                  <h3 className="text-2xl font-extrabold md:text-3xl">{b.name}</h3>
                  <dl className="mt-4 space-y-3">
                    <div><dt className="text-sm font-semibold text-muted-foreground">Who it is for</dt><dd>{b.who}</dd></div>
                    <div><dt className="text-sm font-semibold text-muted-foreground">Typical size</dt><dd>{b.size}</dd></div>
                    <div><dt className="text-sm font-semibold text-muted-foreground">What it replaces</dt><dd>{b.replaces}</dd></div>
                    <div><dt className="text-sm font-semibold text-muted-foreground">Example monthly saving</dt><dd className="font-display text-xl font-bold text-action">{b.saving}</dd></div>
                  </dl>
                  <Link to="/apply" search={{ category: "solar", product: p?.id, price: p?.cash_price }} className={`${btn()} mt-5`}>Apply for this</Link>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="text-3xl font-extrabold">How the no-deposit plan works</h2>
            <p className="mt-3 text-muted-foreground">Straight answers to what people ask us most.</p>
          </div>
          <ol className="space-y-6">
            {faqs.map(([q, a], i) => (
              <li key={q} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b pb-6 last:border-0">
                <span className="font-display text-3xl font-extrabold text-action" aria-hidden>{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{q}</h3>
                  <p className="mt-1 text-muted-foreground">{a}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl font-extrabold">Packages</h2>
        <p className="mt-2 text-muted-foreground">Payments shown for 12 months. Use the calculator below for other durations.</p>
        <div className="mt-6 overflow-x-auto rounded-lg border bg-surface">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-muted text-sm">
              <tr>
                <th scope="col" className="p-3">Package</th><th scope="col" className="p-3">What it can power</th><th scope="col" className="p-3">Price</th>
                <th scope="col" className="p-3">Weekly</th><th scope="col" className="p-3">Monthly</th><th scope="col" className="p-3">Duration</th><th className="p-3"><span className="sr-only">Apply</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7} className="p-3"><Skeleton className="h-8" /></td></tr>)}
              {packages?.map((p) => {
                const w = calculatePlan({ price: p.cash_price, months: 12, frequency: "weekly", markups });
                const m = calculatePlan({ price: p.cash_price, months: 12, frequency: "monthly", markups });
                const specs = p.specs as any;
                return (
                  <tr key={p.id} className="border-t align-top">
                    <th scope="row" className="p-3 font-display font-bold text-navy">{p.name.replace(" business system", "")}</th>
                    <td className="p-3 text-sm">{specs.Powers}</td>
                    <td className="p-3">{naira(p.cash_price)}</td>
                    <td className="p-3 font-semibold">{naira(w.perPayment)}</td>
                    <td className="p-3">{naira(m.perPayment)}</td>
                    <td className="p-3">12 months</td>
                    <td className="p-3"><Link to="/apply" search={{ category: "solar", product: p.id, price: p.cash_price, duration: 12 }} className="font-semibold text-action underline">Apply</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-10">
          <InstallmentCalculator products={(packages ?? []).map((p) => ({ id: p.id, name: p.name, price: p.cash_price, category: "solar" }))} />
        </div>
      </Section>

      <Section tone="surface">
        <Testimonials category="solar" title="Solar customers" />
        <Gallery category="solar" />
      </Section>

      <FinalCta topic="solar for my business" />
    </>
  );
}
