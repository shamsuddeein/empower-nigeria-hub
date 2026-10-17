import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ContactBar } from "@/components/site/ContactBar";
import { companyDefaults } from "@/config/company";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="container-site py-24">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 text-4xl font-extrabold">This page does not exist</h1>
      <p className="mt-3 text-muted-foreground">The link may be old or mistyped.</p>
      <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-md bg-action px-5 font-semibold text-action-foreground">
        Go to the home page
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="container-site py-24">
      <h1 className="text-2xl font-bold">This page did not load</h1>
      <p className="mt-2 text-muted-foreground">Check your network and try again.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex h-12 items-center rounded-md bg-action px-5 font-semibold text-action-foreground"
        >
          Try again
        </button>
        <a href="/" className="inline-flex h-12 items-center rounded-md border px-5 font-semibold text-navy">Go home</a>
      </div>
    </div>
  );
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: companyDefaults.name,
  description: companyDefaults.description,
  telephone: companyDefaults.phoneIntl,
  email: companyDefaults.email,
  address: { "@type": "PostalAddress", streetAddress: companyDefaults.address, addressCountry: "NG" },
  areaServed: "Northern Nigeria",
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1F2A7A" },
      { title: "S.i and Billionaires Hub | Solar, EVs, phones and land on installment" },
      { name: "description", content: companyDefaults.description },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(orgJsonLd) }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    var unregisteredAny = false;
    for (var i = 0; i < registrations.length; i++) {
      var r = registrations[i];
      if (r.scope.indexOf("localhost") !== -1 || r.scope.indexOf("127.0.0.1") !== -1) {
        r.unregister();
        unregisteredAny = true;
        console.info("[SW-Cleanup] Unregistered obsolete service worker for:", r.scope);
      }
    }
    if (unregisteredAny && navigator.serviceWorker.controller) {
      window.location.reload();
    }
  });
  if ("caches" in window) {
    caches.keys().then(function(keys) {
      for (var k = 0; k < keys.length; k++) {
        caches.delete(keys[k]);
        console.info("[SW-Cleanup] Purged cache:", keys[k]);
      }
    });
  }
}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = path.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : (
        <>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-3">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">
            <Outlet />
          </main>
          <SiteFooter />
          <ContactBar />
        </>
      )}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
