import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FinalCta } from "@/components/site/CallWhatsApp";
import { Gallery, Testimonials } from "@/components/site/Proof";
import { Badge, btn, PageHeader, Photo, Section, Skeleton } from "@/components/site/ui";
import { supabase } from "@/integrations/supabase/client";
import { useMarkups } from "@/lib/data";
import { naira } from "@/lib/format";
import { calculatePlan } from "@/lib/installments";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/electric-vehicles")({
  head: () => seo("Electric motorcycles and tricycles", "Electric okada and keke napep on weekly payments. Charge at home and stop buying petrol every morning."),
  component: EvPage,
});

// Placeholder: electricity cost to charge as a percentage of the same distance on petrol. Edit when real figures are known.
const CHARGE_COST_PERCENT = 20;

function FuelCalc() {
  const [daily, setDaily] = useState(5000);
  const [days, setDays] = useState(6);
  const weekly = daily * days;
  const monthly = Math.round((weekly * 52) / 12);
  const evMonthly = Math.round((monthly * CHARGE_COST_PERCENT) / 100);
  const diff = monthly - evMonthly;
  return (
    <div className="grid overflow-hidden rounded-lg border bg-surface md:grid-cols-2">
      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label htmlFor="fuel-daily" className="block text-sm font-semibold">What you spend on fuel each day (₦)</label>
          <input id="fuel-daily" inputMode="numeric" value={daily ? daily.toLocaleString("en-NG") : ""} onChange={(e) => setDaily(Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0)} className="h-12 w-full rounded-md border border-input bg-surface px-3 text-lg font-semibold" />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Days you work each week</legend>
          <div className="flex gap-1.5">
            {[4, 5, 6, 7].map((d) => (
              <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={cn("h-12 flex-1 rounded-md border font-semibold", days === d ? "border-navy bg-navy text-navy-foreground" : "border-input bg-surface hover:bg-accent")}>{d}</button>
            ))}
          </div>
        </fieldset>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Fuel per week</dt><dd className="text-lg font-semibold">{naira(weekly)}</dd></div>
          <div><dt className="text-muted-foreground">Fuel per month</dt><dd className="text-lg font-semibold">{naira(monthly)}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Estimated charging per month</dt><dd className="text-lg font-semibold">{naira(evMonthly)}</dd></div>
        </dl>
      </div>
      <div className="bg-action p-5 text-action-foreground" aria-live="polite">
        <p className="text-sm">You could keep about</p>
        <p className="font-display text-5xl font-extrabold">{naira(diff)}</p>
        <p>every month</p>
        <p className="mt-4 text-sm text-action-foreground/90">Estimate. Assumes charging costs about {CHARGE_COST_PERCENT}% of what you spend on fuel for the same distance. Your electricity tariff and load change this.</p>
      </div>
    </div>
  );
}

const comparison = [
  ["Fuel or charging per day", "₦4,000 to ₦6,000", "₦800 to ₦1,500"],
  ["Maintenance per month", "₦8,000 to ₦15,000 (oil, plugs, chain)", "₦2,000 to ₦5,000 (brakes, tyres)"],
  ["Noise", "Loud engine", "Very quiet, only road and motor hum"],
  ["Daily running cost", "₦5,000 to ₦7,000", "₦1,000 to ₦2,000"],
  ["Moving parts in the drive", "Over 100", "About 20"],
];

function EvPage() {
  const markups = useMarkups();
  const [type, setType] = useState<"all" | "motorcycle" | "tricycle">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["products", "ev"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("category", "ev").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter((v) => type === "all" || (v.specs as Record<string, string>).type === type);

  return (
    <>
      <PageHeader eyebrow="Electric vehicles" title="Electric motorcycles and tricycles. Stop paying for fuel.">
        Charge at home overnight, ride all day, and pay for the vehicle weekly from what you used to spend on petrol.
      </PageHeader>

      <Section>
        <h2 className="mb-6 text-3xl font-extrabold">How much fuel are you burning?</h2>
        <FuelCalc />
      </Section>

      <Section tone="surface">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold">Vehicles</h2>
          <div role="group" aria-label="Filter by type" className="flex gap-1.5">
            {(["all", "motorcycle", "tricycle"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={cn("h-11 rounded-md border px-4 text-sm font-semibold capitalize", type === t ? "border-navy bg-navy text-navy-foreground" : "border-input bg-surface hover:bg-accent")}>
                {t === "all" ? "All" : t === "motorcycle" ? "Motorcycles" : "Tricycles"}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-6 divide-y border-y">
          {isLoading && [0, 1].map((i) => <li key={i} className="py-5"><Skeleton className="h-40" /></li>)}
          {!isLoading && !list.length && <li className="py-8 text-muted-foreground">No vehicles of this type right now. Ask us on WhatsApp for the next arrival.</li>}
          {list.map((v) => {
            const s = v.specs as Record<string, string>;
            const w = calculatePlan({ price: v.cash_price, months: 12, frequency: "weekly", markups });
            return (
              <li key={v.id} className="grid gap-5 py-6 md:grid-cols-[280px_1fr_auto] md:items-center">
                <Photo label={v.name} src={v.images?.[0]} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-extrabold">{v.name}</h3>
                    <Badge tone="navy" className="capitalize">{s.type}</Badge>
                    {!v.in_stock && <Badge tone="warn">Out of stock</Badge>}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div><dt className="text-muted-foreground">Range</dt><dd className="font-semibold">{s.range_km} km</dd></div>
                    <div><dt className="text-muted-foreground">Top speed</dt><dd className="font-semibold">{s.top_speed_kmh} km/h</dd></div>
                    <div><dt className="text-muted-foreground">Charging</dt><dd className="font-semibold">{s.charging_time}</dd></div>
                  </dl>
                </div>
                <div className="md:text-right">
                  <p className="font-display text-2xl font-extrabold text-navy">{naira(w.perPayment)}<span className="text-base font-semibold"> a week</span></p>
                  <p className="text-sm text-muted-foreground">for 12 months. Cash price {naira(v.cash_price)}</p>
                  <Link to="/apply" search={{ category: "ev", product: v.id, price: v.cash_price, duration: 12, frequency: "weekly" }} className={`${btn()} mt-3 w-full md:w-auto`}>Apply for this vehicle</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <h2 className="text-3xl font-extrabold">Petrol versus electric</h2>
        <p className="mt-2 text-muted-foreground">Estimates for a working okada in a Northern city. Your own costs may differ.</p>
        <div className="mt-6 overflow-x-auto rounded-lg border bg-surface">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-muted text-sm"><tr><th scope="col" className="p-3">Item</th><th scope="col" className="p-3">Petrol bike</th><th scope="col" className="p-3">Electric bike</th></tr></thead>
            <tbody>
              {comparison.map(([a, b, c]) => (
                <tr key={a} className="border-t"><th scope="row" className="p-3 font-semibold">{a}</th><td className="p-3">{b}</td><td className="p-3">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Electric bikes cost more to buy and the battery will need replacing after some years. Factor that in.</p>
      </Section>

      <Section tone="surface">
        <h2 className="text-3xl font-extrabold">Charging and service</h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            ["Charging at home", "Plug the charger into a normal wall socket overnight. A full charge takes 6 to 8 hours. With NEPA light or a small solar kit, this is enough for a day's work."],
            ["Charging stations", "We are setting up charging points at partner shops in Kano, Kaduna and Abuja. Ask us for the nearest one."],
            ["Battery swap", "Where available, swap a flat battery for a charged one in a few minutes for a small fee. Currently being tested in Kano."],
            ["Service centres", "Bring the vehicle to our service centre for brakes, tyres and battery checks. Free check every three months during your plan."],
          ].map(([t, d]) => (
            <div key={t} className="border-l-2 border-navy pl-4">
              <dt className="text-lg font-bold text-navy">{t}</dt>
              <dd className="mt-1 text-muted-foreground">{d}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <Testimonials category="ev" title="Riders on electric" />
        <Gallery category="ev" />
      </Section>

      <FinalCta topic="electric motorcycles and tricycles" />
    </>
  );
}
