import { Link } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { calculatePlan, type Frequency } from "@/lib/installments";
import { useMarkups } from "@/lib/data";
import { naira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

type Option = { id: string; name: string; price: number; category: string };

export function InstallmentCalculator({ products = [], initialPrice = 850000, compact = false }: { products?: Option[]; initialPrice?: number; compact?: boolean }) {
  const markups = useMarkups();
  const [price, setPrice] = useState(initialPrice);
  const [productId, setProductId] = useState("");
  const [months, setMonths] = useState(6);
  const [custom, setCustom] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [deposit, setDeposit] = useState(0);
  const id = useId();
  const r = useMemo(() => calculatePlan({ price, months, frequency, deposit, markups }), [price, months, frequency, deposit, markups]);
  const product = products.find((p) => p.id === productId);

  const seg = (on: boolean) =>
    cn("h-12 flex-1 rounded-md border text-base font-semibold", on ? "border-navy bg-navy text-navy-foreground" : "border-input bg-surface text-foreground hover:bg-accent");

  return (
    <div className="grid overflow-hidden rounded-lg border bg-surface md:grid-cols-[1.1fr_1fr]">
      <div className="order-2 space-y-4 p-4 md:order-1 md:p-6">
        {products.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor={`${id}-p`} className="block text-sm font-semibold">Choose a product</label>
            <select
              id={`${id}-p`}
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                if (p) setPrice(p.price);
              }}
              className="h-12 w-full rounded-md border border-input bg-surface px-3"
            >
              <option value="">Enter my own price</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({naira(p.price)})</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor={`${id}-price`} className="block text-sm font-semibold">Product price (₦)</label>
          <input
            id={`${id}-price`}
            inputMode="numeric"
            value={price ? price.toLocaleString("en-NG") : ""}
            onChange={(e) => {
              setProductId("");
              setPrice(Number(e.target.value.replace(/\D/g, "").slice(0, 10)) || 0);
            }}
            className="h-12 w-full rounded-md border border-input bg-surface px-3 text-lg font-semibold"
          />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">How long to pay</legend>
          <div className="flex gap-1.5">
            {[3, 6, 9, 12].map((m) => (
              <button key={m} type="button" aria-pressed={!custom && months === m} onClick={() => { setCustom(false); setMonths(m); }} className={seg(!custom && months === m)}>
                {m}
              </button>
            ))}
            <button type="button" aria-pressed={custom} onClick={() => setCustom(true)} className={seg(custom)}>Other</button>
          </div>
          {custom && (
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor={`${id}-m`} className="text-sm">Months</label>
              <input id={`${id}-m`} type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Math.min(24, Math.max(1, Number(e.target.value) || 1)))} className="h-12 w-24 rounded-md border border-input bg-surface px-3" />
            </div>
          )}
          <p className="mt-1 text-sm text-muted-foreground">Months</p>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Pay every</legend>
          <div className="flex gap-1.5">
            <button type="button" aria-pressed={frequency === "weekly"} onClick={() => setFrequency("weekly")} className={seg(frequency === "weekly")}>Week</button>
            <button type="button" aria-pressed={frequency === "monthly"} onClick={() => setFrequency("monthly")} className={seg(frequency === "monthly")}>Month</button>
          </div>
        </fieldset>
        {!compact && (
          <div className="space-y-1.5">
            <label htmlFor={`${id}-d`} className="block text-sm font-semibold">Deposit (₦) <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input id={`${id}-d`} inputMode="numeric" value={deposit ? deposit.toLocaleString("en-NG") : ""} placeholder="0" onChange={(e) => setDeposit(Number(e.target.value.replace(/\D/g, "").slice(0, 10)) || 0)} className="h-12 w-full rounded-md border border-input bg-surface px-3" />
          </div>
        )}
      </div>
      <div className="order-1 bg-navy p-4 text-navy-foreground md:order-2 md:p-6" aria-live="polite">
        <p className="text-sm text-navy-muted">You pay</p>
        <p className="font-display text-4xl font-extrabold md:text-5xl">{naira(r.perPayment)}</p>
        <p className="text-navy-muted">every {frequency === "weekly" ? "week" : "month"}, {r.payments} payments</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-navy-foreground/20 pt-4 text-sm">
          <div><dt className="text-navy-muted">Total you pay</dt><dd className="text-lg font-semibold">{naira(r.total)}</dd></div>
          <div><dt className="text-navy-muted">Extra over cash price</dt><dd className="text-lg font-semibold">{naira(r.extra)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-navy-muted">This is an estimate. Final terms are agreed with our team before you sign.</p>
        <Link
          to="/apply"
          search={{ price, duration: months, frequency, product: product?.id, category: product?.category }}
          className={cn(btn({ variant: "primary" }), "mt-4 w-full")}
        >
          Apply with these numbers
        </Link>
      </div>
    </div>
  );
}
