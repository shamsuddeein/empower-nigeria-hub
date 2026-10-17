import { Link } from "@tanstack/react-router";
import { useCompany } from "@/lib/data";
import { Logo } from "./Logo";
import { primaryNav } from "./nav";

export function SiteFooter() {
  const { company, tel, wa } = useCompany();
  const h = "mb-3 font-display text-sm font-bold uppercase tracking-wider text-navy-muted";
  const a = "inline-flex min-h-10 items-center text-navy-foreground hover:underline";
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo onNavy />
          <p className="mt-4 max-w-xs text-navy-muted">{company.description}</p>
        </div>
        <div>
          <h2 className={h}>Products</h2>
          <ul>
            {primaryNav.slice(0, 5).map((n) => (
              <li key={n.to}><Link to={n.to} className={a}>{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={h}>Company</h2>
          <ul>
            <li><Link to="/about" className={a}>About</Link></li>
            <li><Link to="/faq" className={a}>FAQ</Link></li>
            <li><Link to="/contact" className={a}>Contact</Link></li>
            <li><Link to="/become-an-agent" className={a}>Become an Agent</Link></li>
            <li><Link to="/agent-locator" className={a}>Agent Locator</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={h}>Contact</h2>
          <ul className="space-y-1">
            <li><a href={tel} className={a}>Phone: {company.phone}</a></li>
            <li><a href={wa("your products and payment plans")} target="_blank" rel="noopener noreferrer" className={a}>WhatsApp: {company.phone}</a></li>
            <li><a href={`mailto:${company.email}`} className={a}>{company.email}</a></li>
            <li className="pt-1 text-navy-muted">{company.address}</li>
            <li className="text-navy-muted">{company.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/15">
        <div className="container-site flex flex-col gap-1 py-5 text-sm text-navy-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {company.name}. {company.rcNumber}.</p>
          <p>Registered in Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
