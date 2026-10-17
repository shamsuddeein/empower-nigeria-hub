export const landingNav = [
  { href: "#services-overview", label: "Services" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
] as const;

export const primaryNav = [
  { to: "/solar", label: "Solar" },
  { to: "/electric-vehicles", label: "Electric Vehicles" },
  { to: "/phones-and-gadgets", label: "Phones and Gadgets" },
  { to: "/land-and-estate", label: "Land and Estate" },
  { to: "/financial-services-and-training", label: "Financial Services and Training" },
  { to: "/become-an-agent", label: "Become an Agent" },
] as const;

export const secondaryNav = [
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/agent-locator", label: "Find an agent" },
] as const;
