import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { InstallmentCalculator } from "@/components/site/InstallmentCalculator";
import { Gallery, Testimonials } from "@/components/site/Proof";
import { CallButton, WhatsAppButton } from "@/components/site/CallWhatsApp";
import { btn, Container, Photo, Section } from "@/components/site/ui";
import { useCompany } from "@/lib/data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Solar for business with no deposit", "Solar for shops, filling stations and pure water factories in Northern Nigeria. Pay weekly or monthly while you use it. No deposit."),
  component: Home,
});

const services = [
  { to: "/solar", name: "Solar for Business", line: "Panels, batteries and inverter installed at your shop. Pay weekly.", photo: "Solar panels on a shop roof" },
  { to: "/electric-vehicles", name: "Electric Vehicles", line: "Electric okada and keke. Charge at home instead of buying petrol.", photo: "Rider with an electric motorcycle" },
  { to: "/phones-and-gadgets", name: "Phones and Gadgets", line: "Phones, laptops and power banks from about ₦6,000 a week.", photo: "Phones on a shop counter" },
  { to: "/land-and-estate", name: "Land and Estate", line: "Plots with documents you can see before you pay.", photo: "Surveyed plot with beacons" },
  { to: "/financial-services-and-training", name: "Financial Services and Training", line: "POS setup, BVN and NIN enrollment, and hands-on courses.", photo: "POS training class" },
] as const;

const steps = [
  ["Choose what you need", "Solar, a vehicle, a phone or a plot. Use the calculator to see the weekly cost."],
  ["Fill the short application form", "Three steps, about four minutes. No BVN, no ID upload."],
  ["We check and agree the plan with you", "We call you within one working day and put the plan in writing."],
  ["We deliver and install, then you pay as agreed", "Our own technicians install. Payments start after."],
];

function Home() {
  const [hover, setHover] = useState(0);
  const { company, tel } = useCompany();
  return (
    <>
      <section className="border-b bg-surface">
        <Container className="grid gap-8 py-10 md:grid-cols-[1.15fr_1fr] md:items-center md:py-16">
          <div className="rise-in">
            <h1 className="text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
              Stop buying fuel every day. Power your business with solar. No deposit.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              We install solar for shops, filling stations, pure water factories and phone charging businesses. You pay small amounts weekly or monthly while you use it.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/apply" className={btn({ size: "lg" })}>Apply Now</Link>
              <WhatsAppButton topic="solar for my business" className="h-14 text-lg" />
            </div>
            <p className="mt-5 text-sm font-medium text-foreground">No deposit. Installation by our own technicians. Payment plan agreed in writing.</p>
          </div>
          <Photo label="our team installing solar panels on a shop roof" ratio="aspect-[4/3] md:aspect-[5/6]" eager />
        </Container>
      </section>

      <Section tone="navy">
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-navy-foreground md:text-4xl">What a generator really costs you</h2>
            <p className="mt-3 text-navy-muted">Example for a small shop running a 2.5kVA generator 10 hours a day. Your numbers will differ.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left">
              <caption className="sr-only">Generator cost versus solar weekly payment, example figures</caption>
              <thead>
                <tr className="border-b border-navy-foreground/25 text-sm text-navy-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Per month</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Generator</th>
                  <th scope="col" className="py-2 font-medium">Solar plan</th>
                </tr>
              </thead>
              <tbody className="text-base">
                <tr className="border-b border-navy-foreground/15"><th scope="row" className="py-3 pr-3 font-medium">Fuel (6 litres a day)</th><td className="pr-3">₦180,000</td><td>₦0</td></tr>
                <tr className="border-b border-navy-foreground/15"><th scope="row" className="py-3 pr-3 font-medium">Servicing and repairs</th><td className="pr-3">₦15,000</td><td>Included</td></tr>
                <tr className="border-b border-navy-foreground/15"><th scope="row" className="py-3 pr-3 font-medium">Plan payment</th><td className="pr-3">₦0</td><td>₦108,000</td></tr>
                <tr><th scope="row" className="py-3 pr-3 font-bold">Total</th><td className="pr-3 font-bold">₦195,000</td><td className="font-bold">₦108,000</td></tr>
              </tbody>
            </table>
            <p className="mt-3 text-sm text-navy-muted">Example only. Fuel at ₦1,000 per litre. Solar is the small system over 12 months, about ₦25,000 a week.</p>
          </div>
        </div>
      </Section>

      <Section>
        <p className="eyebrow">What we do</p>
        <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Five things, all on payment plans</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y border-y">
            {services.map((s, i) => (
              <li key={s.to} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                <Link to={s.to} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-5">
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-bold text-navy group-hover:text-action md:text-2xl">{s.name}</span>
                    <span className="mt-1 block text-muted-foreground">{s.line}</span>
                  </span>
                  <span className="text-sm font-semibold text-action underline-offset-4 group-hover:underline">See more</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden lg:block">
            <Photo label={services[hover].photo} ratio="aspect-[4/5]" className="sticky top-28" />
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="text-3xl font-extrabold md:text-4xl">How the plan works</h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-2">
              {steps.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="font-display text-6xl font-extrabold leading-none text-action" aria-hidden>{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-bold">{t}</h3>
                    <p className="mt-1 text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="self-start rounded-lg border-l-4 border-navy bg-accent p-6">
            <p className="font-display text-xl font-bold text-navy">You will always see the full price and every payment before you agree.</p>
          </aside>
        </div>
      </Section>

      <Section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-extrabold md:text-4xl">Work out your weekly payment</h2>
          <Link to="/solar" className="font-semibold text-navy underline underline-offset-4">See solar packages</Link>
        </div>
        <InstallmentCalculator compact />
      </Section>

      <Section tone="surface">
        <Testimonials title="Customers in Kano, Kaduna and Katsina" />
        <Gallery />
      </Section>

      <section className="bg-action py-12 text-action-foreground md:py-16">
        <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-action-foreground">Earn by selling in your town</h2>
            <p className="mt-2 max-w-xl text-action-foreground/90">Agents and ambassadors earn commission on every completed sale. Registration is free.</p>
          </div>
          <Link to="/become-an-agent" className={btn({ variant: "onAction", size: "lg" })}>Become an agent</Link>
        </Container>
      </section>

      <Section>
        <h2 className="text-4xl font-extrabold md:text-5xl">Ready to start?</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Call us on <a href={tel} className="font-semibold text-navy underline">{company.phone}</a>, {company.hours.toLowerCase()}.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/apply" className={btn({ size: "lg" })}>Apply Now</Link>
          <WhatsAppButton topic="your payment plans" className="h-14" />
          <CallButton className="h-14" />
        </div>
      </Section>
    </>
  );
}
