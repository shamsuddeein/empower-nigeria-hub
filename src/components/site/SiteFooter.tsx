import { useCompany } from "@/lib/data";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { company, tel, wa, hasRealPhone, hasRealWhatsApp } = useCompany();
  const h = "mb-3 font-display text-sm font-bold uppercase tracking-wider text-navy-muted";
  const a =
    "inline-flex min-h-10 items-center text-navy-foreground hover:underline transition-colors";

  return (
    <footer
      id="contact"
      className="border-t border-navy-foreground/10 bg-navy text-navy-foreground scroll-mt-20"
    >
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:py-16">
        <div>
          <Logo onNavy />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-muted">
            Commercial solar systems, electric mobility, essential devices, verified land, and
            financial training on structured instalments across Northern Nigeria.
          </p>
        </div>

        <div>
          <h2 className={h}>Navigation</h2>
          <ul className="space-y-1">
            <li>
              <a href="#services-overview" className={a}>
                Services Overview
              </a>
            </li>
            <li>
              <a href="#how-it-works" className={a}>
                How It Works
              </a>
            </li>
            <li>
              <a href="#about" className={a}>
                About the Company
              </a>
            </li>
            <li>
              <a href="#faq" className={a}>
                Frequently Asked Questions
              </a>
            </li>
            <li>
              <a href="#enquire" className={a}>
                Submit Enquiry
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={h}>Commercial Offers</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a href="#services-solar" className={a}>
                Solar for Business
              </a>
            </li>
            <li>
              <a href="#services-ev" className={a}>
                Electric Motorcycles & Tricycles
              </a>
            </li>
            <li>
              <a href="#services-gadgets" className={a}>
                Phones and Gadgets
              </a>
            </li>
            <li>
              <a href="#services-land" className={a}>
                Land and Estate
              </a>
            </li>
            <li>
              <a href="#services-finance" className={a}>
                Financial Services & Training
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={h}>Company Contact & Channels</h2>
          <ul className="space-y-2 text-sm text-navy-muted">
            <li>
              <span className="block font-semibold text-navy-foreground">Office Phone</span>
              {hasRealPhone ? (
                <a href={tel} className="text-navy-foreground underline hover:opacity-80">
                  {company.phone}
                </a>
              ) : (
                <a href="#enquire" className="text-navy-foreground underline hover:opacity-80">
                  Submit Enquiry (Direct line pending allocation)
                </a>
              )}
            </li>
            <li>
              <span className="block font-semibold text-navy-foreground">WhatsApp Line</span>
              {hasRealWhatsApp ? (
                <a
                  href={wa()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-foreground underline hover:opacity-80"
                >
                  Chat on WhatsApp
                </a>
              ) : (
                <a href="#enquire" className="text-navy-foreground underline hover:opacity-80">
                  Submit Enquiry (WhatsApp pending allocation)
                </a>
              )}
            </li>
            <li>
              <span className="block font-semibold text-navy-foreground">Email</span>
              <a
                href={`mailto:${company.email}`}
                className="text-navy-foreground underline hover:opacity-80"
              >
                {company.email}
              </a>
            </li>
            <li className="pt-1">
              <span className="block font-semibold text-navy-foreground">Operating Address</span>
              <span>{company.address}</span>
            </li>
            <li>
              <span className="block font-semibold text-navy-foreground">Working Hours</span>
              <span>{company.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-foreground/15">
        <div className="container-site flex flex-col gap-2 py-6 text-sm text-navy-muted sm:flex-row sm:justify-between sm:items-center">
          <p>
            © {new Date().getFullYear()} {company.name}. {company.rcNumber ? company.rcNumber : "Commercial Equipment Solutions"}.
          </p>
          <p>Transparent instalment terms. Registered in Nigeria.</p>
        </div>
      </div>
    </footer>
  );
}
