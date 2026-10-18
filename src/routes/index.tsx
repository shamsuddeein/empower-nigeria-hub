import { createFileRoute } from "@tanstack/react-router";
import { useState, useId, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useCompany,
  useMarkups,
  companyQuery,
  productsQuery,
  plotsQuery,
  coursesQuery,
  agentsQuery,
  testimonialsQuery,
  galleryQuery,
} from "@/lib/data";
import {
  submitLandInquiryFn,
  submitAgentApplicationFn,
  submitTrainingSignupFn,
  submitMessageFn,
} from "@/server/functions/publicSubmissions";
import { isRealContactNumber, waLink, telLink } from "@/config/company";
import { normalizeNgPhone, NORTHERN_STATES } from "@/lib/validation";
import { calculatePlan, type Frequency } from "@/lib/installments";
import { naira } from "@/lib/format";
import { seo } from "@/lib/seo";
import { btn, inputCls, Container, Badge } from "@/components/site/ui";
import {
  ApplicationModal,
  type ApplicationInitialData,
} from "@/components/site/ApplicationModal";
import {
  ProductDetailPanel,
  type ProductDetailItem,
} from "@/components/site/ProductDetailPanel";
import { ServiceImage } from "@/components/site/ServiceImage";
import {
  ProductImagePlaceholder,
  PlotImagePlaceholder,
} from "@/components/site/DevelopmentPlaceholders";
import { cn } from "@/lib/utils";
import { matchesProductCategory } from "@/lib/taxonomy";

function isDirectVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
}

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "Power your daily life and business.",
      "We offer business solar, electric motorcycles and tricycles, phones and gadgets, land and estate, financial services, and practical training with structured installment plans for eligible products."
    ),
  loader: async ({ context }: { context: { queryClient?: import("@tanstack/react-query").QueryClient } }) => {
    if (context?.queryClient) {
      await context.queryClient.ensureQueryData(companyQuery).catch(() => {});
    }
  },
  component: PublicLandingPage,
});

function parseNairaInput(raw: string): { value: number; error: string | null; isEmpty: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: 0, error: null, isEmpty: true };
  }
  if (trimmed.startsWith("-") || trimmed.includes("-")) {
    return { value: -1, error: "Cash price and deposit must be positive numbers.", isEmpty: false };
  }
  const cleaned = trimmed.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return { value: NaN, error: "Please enter a valid numeric amount.", isEmpty: false };
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return { value: NaN, error: "Please enter a valid numeric amount.", isEmpty: false };
  }
  return { value: num, error: null, isEmpty: false };
}

function CatalogueCardImage({
  src,
  alt,
  category,
  productName,
}: {
  src?: string | undefined;
  alt: string;
  category?: string | undefined;
  productName: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <ProductImagePlaceholder
        category={category}
        productName={productName}
        className="mt-3 mb-2"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="mt-3 mb-2 aspect-[16/10] w-full rounded-lg object-cover border border-border"
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}

export function PublicLandingPage() {
  const { company, tel, wa, hasRealPhone, hasRealWhatsApp } = useCompany();
  const markups = useMarkups();
  const genId = useId();

  // Application Modal State
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appModalData, setAppModalData] =
    useState<ApplicationInitialData | null>(null);

  // Product Details Panel State
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDetailItem | null>(null);

  // Gadgets Category Filter
  const [gadgetFilter, setGadgetFilter] = useState<string>("all");

  // EV Running Cost Calculator State (Explicit user inputs without fixed percent assumptions)
  const [evDailyFuel, setEvDailyFuel] = useState<number>(5000);
  const [evDailyCharge, setEvDailyCharge] = useState<number>(1000);
  const [evDaysWorked, setEvDaysWorked] = useState<number>(6);
  const evWeeklyPetrol = evDailyFuel * evDaysWorked;
  const evMonthlyPetrol = Math.round((evWeeklyPetrol * 52) / 12);
  const evWeeklyElectric = evDailyCharge * evDaysWorked;
  const evMonthlyElectric = Math.round((evWeeklyElectric * 52) / 12);
  const evMonthlySavings = Math.max(0, evMonthlyPetrol - evMonthlyElectric);

  // General Installment Calculator State
  const [calcPriceRaw, setCalcPriceRaw] = useState<string>("850,000");
  const [calcDepositRaw, setCalcDepositRaw] = useState<string>("");
  const [calcDuration, setCalcDuration] = useState<number>(6);
  const [calcFrequency, setCalcFrequency] = useState<Frequency>("weekly");
  const [calcError, setCalcError] = useState<string | null>(null);

  const parsedPrice = parseNairaInput(calcPriceRaw);
  const parsedDeposit = parseNairaInput(calcDepositRaw);

  const priceVal = parsedPrice.value;
  const depositVal = parsedDeposit.value;

  let inlinePriceError: string | null = null;
  if (parsedPrice.error) {
    inlinePriceError = parsedPrice.error;
  } else if (parsedPrice.isEmpty) {
    inlinePriceError = "Please enter equipment cash price.";
  } else if (priceVal <= 0) {
    inlinePriceError = "Equipment cash price must be greater than zero.";
  }

  let inlineDepositError: string | null = null;
  if (parsedDeposit.error) {
    inlineDepositError = parsedDeposit.error;
  } else if (depositVal < 0) {
    inlineDepositError = "Deposit cannot be negative.";
  } else if (priceVal > 0 && depositVal >= priceVal) {
    inlineDepositError = "Deposit must be less than the cash price.";
  }

  let planResult: ReturnType<typeof calculatePlan> | null = null;
  if (
    priceVal > 0 &&
    Number.isFinite(priceVal) &&
    depositVal >= 0 &&
    Number.isFinite(depositVal) &&
    depositVal < priceVal &&
    !parsedPrice.error &&
    !parsedDeposit.error
  ) {
    try {
      planResult = calculatePlan({
        price: priceVal,
        months: calcDuration,
        frequency: calcFrequency,
        deposit: depositVal,
        markups,
      });
    } catch {
      planResult = null;
    }
  }

  // Benchmark Installment Calculations for Curated Preview Cards
  const planSolarCompact = calculatePlan({
    price: 850000,
    months: 6,
    frequency: "weekly",
    markups,
  });
  const planSolarMedium = calculatePlan({
    price: 1650000,
    months: 6,
    frequency: "weekly",
    markups,
  });
  const planEvOkada = calculatePlan({
    price: 950000,
    months: 6,
    frequency: "weekly",
    markups,
  });
  const planEvKeke = calculatePlan({
    price: 2150000,
    months: 12,
    frequency: "weekly",
    markups,
  });

  // Agent Locator State
  const [selectedState, setSelectedState] = useState<string>("Kaduna");

  // Land Inquiry Form State
  const [showLandForm, setShowLandForm] = useState<boolean>(false);
  const [landPlotId, setLandPlotId] = useState<string>("");
  const [landPlotName, setLandPlotName] = useState<string>("");
  const [landFullName, setLandFullName] = useState<string>("");
  const [landPhone, setLandPhone] = useState<string>("");
  const [landState, setLandState] = useState<string>("Kaduna");
  const [landPlan, setLandPlan] = useState<string>("Outright Payment");
  const [landMessage, setLandMessage] = useState<string>("");
  const [landSubmitting, setLandSubmitting] = useState<boolean>(false);
  const [landSubmitted, setLandSubmitted] = useState<boolean>(false);
  const [landError, setLandError] = useState<string | null>(null);

  // Training Signup Form State
  const [trainCourseId, setTrainCourseId] = useState<string>("");
  const [trainCourseTitle, setTrainCourseTitle] = useState<string>(
    "Solar Installation Training"
  );
  const [trainFullName, setTrainFullName] = useState<string>("");
  const [trainPhone, setTrainPhone] = useState<string>("");
  const [trainState, setTrainState] = useState<string>("Kaduna");
  const [trainSubmitting, setTrainSubmitting] = useState<boolean>(false);
  const [trainSubmitted, setTrainSubmitted] = useState<boolean>(false);
  const [submittedCourseTitle, setSubmittedCourseTitle] = useState<string>("");
  const [trainError, setTrainError] = useState<string | null>(null);

  // Agent Application Form State
  const [showAgentForm, setShowAgentForm] = useState<boolean>(false);
  const [agentName, setAgentName] = useState<string>("");
  const [agentPhone, setAgentPhone] = useState<string>("");
  const [agentWa, setAgentWa] = useState<string>("");
  const [agentState, setAgentState] = useState<string>("Kaduna");
  const [agentLga, setAgentLga] = useState<string>("");
  const [agentTown, setAgentTown] = useState<string>("");
  const [agentType, setAgentType] = useState<"Agent" | "Ambassador">("Agent");
  const [agentOccupation, setAgentOccupation] = useState<string>("");
  const [agentHasShop, setAgentHasShop] = useState<boolean>(false);
  const [agentNote, setAgentNote] = useState<string>("");
  const [agentSubmitting, setAgentSubmitting] = useState<boolean>(false);
  const [agentSubmitted, setAgentSubmitted] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  // General Enquiry Form State
  const [enqCategory, setEnqCategory] = useState<string>("Solar for Business");
  const [enqName, setEnqName] = useState<string>("");
  const [enqPhone, setEnqPhone] = useState<string>("");
  const [enqState, setEnqState] = useState<string>("Kaduna");
  const [enqTown, setEnqTown] = useState<string>("");
  const [enqMessage, setEnqMessage] = useState<string>("");
  const [enqSubmitting, setEnqSubmitting] = useState<boolean>(false);
  const [enqSubmitted, setEnqSubmitted] = useState<boolean>(false);
  const [enqError, setEnqError] = useState<string | null>(null);

  // Server Function Queries with Loading / Error States
  const {
    data: allProducts,
    isError: isProductsError,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery(productsQuery);

  const {
    data: allPlots,
    isError: isPlotsError,
    isLoading: isPlotsLoading,
    refetch: refetchPlots,
  } = useQuery(plotsQuery);

  const {
    data: allCourses,
    isError: isCoursesError,
    isLoading: isCoursesLoading,
    refetch: refetchCourses,
  } = useQuery(coursesQuery);

  const {
    data: allAgentsList,
    isError: isAgentsError,
    isLoading: isAgentsLoading,
    refetch: refetchAgents,
  } = useQuery(agentsQuery);

  // Synchronize training course selection so dropdown display and submission payload always agree
  const effectiveCourseId =
    trainCourseId || (allCourses && allCourses.length > 0 ? allCourses[0]?.id ?? "" : "");
  const selectedCourse = (allCourses ?? []).find((c) => c.id === effectiveCourseId);
  const effectiveCourseTitle =
    selectedCourse?.title ||
    trainCourseTitle ||
    (allCourses && allCourses.length > 0 ? allCourses[0]?.title ?? "Solar Installation Training" : "Solar Installation Training");

  const approvedAgents = (allAgentsList ?? []).filter(
    (ag) => ag.state === selectedState
  );

  const { data: approvedTestimonials } = useQuery(testimonialsQuery());
  const { data: approvedGallery } = useQuery(galleryQuery());

  const validGalleryItems = (approvedGallery ?? []).filter(
    (g) => Boolean(g.image?.trim() || g.video_url?.trim())
  );
  const hasApprovedEvidence =
    Boolean(approvedTestimonials && approvedTestimonials.length > 0) ||
    validGalleryItems.length > 0;

  // Filter Gadgets by Subcategory
  const gadgetProducts = (allProducts ?? []).filter((p) => {
    if (p.category === "solar" || p.category === "ev") return false;
    if (gadgetFilter === "all") return true;
    return matchesProductCategory(p.category, gadgetFilter);
  });

  const openApplyForProduct = (
    product: ProductDetailItem,
    durationMonths = 6,
    freq: Frequency = "weekly"
  ) => {
    // Only forward real published catalogue product IDs to preserve server DB verification.
    // Non-catalogue service concepts or assessments route without productId.
    const matchingCatalogueProduct = (allProducts ?? []).find(
      (p) => Boolean(p.id && product.id && p.id === product.id)
    );

    const modalData: ApplicationInitialData = {
      productName: matchingCatalogueProduct ? matchingCatalogueProduct.name : product.name,
      category: matchingCatalogueProduct ? matchingCatalogueProduct.category : product.category,
      price: matchingCatalogueProduct ? matchingCatalogueProduct.cash_price : product.cash_price,
      duration: durationMonths,
      frequency: freq,
      deposit: 0,
    };
    if (matchingCatalogueProduct?.id) {
      modalData.productId = matchingCatalogueProduct.id;
    }

    setAppModalData(modalData);
    setAppModalOpen(true);
    setSelectedProduct(null);
  };

  const handleLandInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (landSubmitting) return;
    setLandError(null);
    const cleanPhone = normalizeNgPhone(landPhone);
    if (!cleanPhone) {
      setLandError("Please enter a valid Nigerian phone number.");
      return;
    }
    if (landFullName.trim().length < 2) {
      setLandError("Please enter your full name.");
      return;
    }

    setLandSubmitting(true);
    try {
      await submitLandInquiryFn({
        data: {
          fullName: landFullName.trim(),
          phone: cleanPhone,
          state: landState,
          plotId: landPlotId || null,
          plotName: landPlotName || "General Land Enquiry",
          paymentPlan: landPlan,
          message: landMessage.trim() || undefined,
        },
      });
      setLandSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit inquiry right now.";
      setLandError(`${msg} Your entered details have been retained; please try again.`);
    } finally {
      setLandSubmitting(false);
    }
  };

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trainSubmitting) return;
    setTrainError(null);
    const cleanPhone = normalizeNgPhone(trainPhone);
    if (!cleanPhone) {
      setTrainError("Please enter a valid Nigerian phone number.");
      return;
    }
    if (trainFullName.trim().length < 2) {
      setTrainError("Please enter your full name.");
      return;
    }

    const targetTitle = effectiveCourseTitle;
    setTrainSubmitting(true);
    try {
      await submitTrainingSignupFn({
        data: {
          courseId: selectedCourse?.id ?? (effectiveCourseId || null),
          courseTitle: targetTitle,
          fullName: trainFullName.trim(),
          phone: cleanPhone,
          state: trainState,
        },
      });
      setSubmittedCourseTitle(targetTitle);
      setTrainSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not record training registration.";
      setTrainError(`${msg} Your entered details have been retained; please try again.`);
    } finally {
      setTrainSubmitting(false);
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agentSubmitting) return;
    setAgentError(null);
    const cleanPhone = normalizeNgPhone(agentPhone);
    if (!cleanPhone) {
      setAgentError("Please enter a valid Nigerian phone number.");
      return;
    }
    const cleanWa = agentWa ? normalizeNgPhone(agentWa) : cleanPhone;
    if (!cleanWa) {
      setAgentError("Please enter a valid WhatsApp number.");
      return;
    }
    if (agentName.trim().length < 2) {
      setAgentError("Please enter your full name.");
      return;
    }

    setAgentSubmitting(true);
    try {
      await submitAgentApplicationFn({
        data: {
          fullName: agentName.trim(),
          phone: cleanPhone,
          whatsapp: cleanWa,
          state: agentState,
          lga: agentLga.trim() || "Central",
          town: agentTown.trim() || agentState,
          type: agentType,
          occupation: agentOccupation.trim() || "Trader",
          hasShop: agentHasShop,
          note: agentNote.trim() || undefined,
          consent: true,
        },
      });
      setAgentSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit application.";
      setAgentError(`${msg} Your entered details have been retained; please try again.`);
    } finally {
      setAgentSubmitting(false);
    }
  };

  const handleGeneralEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enqSubmitting) return;
    setEnqError(null);
    const cleanPhone = normalizeNgPhone(enqPhone);
    if (!cleanPhone) {
      setEnqError("Please enter a valid Nigerian phone number.");
      return;
    }
    if (enqName.trim().length < 2) {
      setEnqError("Please enter your full name.");
      return;
    }

    setEnqSubmitting(true);
    try {
      await submitMessageFn({
        data: {
          name: enqName.trim(),
          phone: cleanPhone,
          topic: enqCategory,
          message: `Location: ${enqTown ? `${enqTown}, ` : ""}${enqState} | Notes: ${enqMessage.trim()}`,
        },
      });
      setEnqSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit enquiry.";
      setEnqError(`${msg} Please retry or contact our office directly.`);
    } finally {
      setEnqSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* ============================================================== */}
      {/* 1. COMPANY-WIDE HERO INTRODUCING ALL SERVICES                  */}
      {/* ============================================================== */}
      <section
        id="hero"
        className="border-b border-border bg-surface py-12 md:py-20 lg:py-24"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">{company.name}</p>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
                Power your daily life and business.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                We offer business solar, electric motorcycles and tricycles, phones and gadgets, land and estate, financial services, and practical training. Ask about available installment plans for eligible products.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#enquire"
                  className={cn(btn({ variant: "primary", size: "lg" }), "font-semibold")}
                >
                  Apply Now
                </a>

                {hasRealWhatsApp ? (
                  <a
                    href={wa()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      btn({ variant: "secondary", size: "lg" }),
                      "font-semibold text-navy hover:text-navy"
                    )}
                  >
                    Chat on WhatsApp
                  </a>
                ) : (
                  <a
                    href="#enquire"
                    className={cn(
                      btn({ variant: "secondary", size: "lg" }),
                      "font-semibold text-navy hover:text-navy"
                    )}
                  >
                    Send an Enquiry
                  </a>
                )}

                {hasRealPhone && (
                  <a
                    href={tel}
                    className={cn(
                      btn({ variant: "ghost", size: "lg" }),
                      "hidden font-semibold text-navy sm:inline-flex"
                    )}
                  >
                    Call {company.phone}
                  </a>
                )}
              </div>

              {/* Compact Overview of 5 Service Areas */}
              <div className="mt-12 border-t border-border pt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service Areas
                </p>
                <ul className="mt-3 flex flex-col divide-y divide-border text-sm sm:flex-row sm:flex-wrap sm:divide-y-0 sm:gap-x-8 sm:gap-y-2">
                  <li>
                    <a
                      href="#services-solar"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy sm:min-h-0"
                    >
                      Solar for Business
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services-ev"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy sm:min-h-0"
                    >
                      Electric Vehicles
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services-gadgets"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy sm:min-h-0"
                    >
                      Phones and Gadgets
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services-land"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy sm:min-h-0"
                    >
                      Land and Estate
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services-finance"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy sm:min-h-0"
                    >
                      Financial Services and Training
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5">
              <ServiceImage imageKey="hero" priority={true} className="w-full" />
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 2. FIVE-SERVICE OVERVIEW (DISCOVERABLE BEFORE SOLAR DEEP-DIVE)  */}
      {/* ============================================================== */}
      <section id="services-overview" className="border-b border-border bg-background py-12 md:py-16 scroll-mt-20">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Enterprise Solutions</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
              Five Essential Services for Northern Nigerian Enterprise
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Structured financing, technical equipment, and verified property designed for daily trade, commercial logistics, and family progress.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* 1. Solar */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-action">01 • Energy</span>
                <h3 className="mt-2 text-lg font-bold text-navy">Solar for Business</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Commercial rooftop solar arrays and lithium storage to replace petrol generators for shops, kiosks, and clinics.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/60">
                <a
                  href="#services-solar"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-action hover:text-action-hover"
                >
                  Explore Solar &rarr;
                </a>
              </div>
            </div>

            {/* 2. Electric Vehicles */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-action">02 • Mobility</span>
                <h3 className="mt-2 text-lg font-bold text-navy">Electric Vehicles</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Commercial electric cargo motorcycles and passenger tricycles built for urban transport with lower running costs.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/60">
                <a
                  href="#services-ev"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-action hover:text-action-hover"
                >
                  Explore Vehicles &rarr;
                </a>
              </div>
            </div>

            {/* 3. Phones and Gadgets */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-action">03 • Technology</span>
                <h3 className="mt-2 text-lg font-bold text-navy">Phones & Gadgets</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Laptops, smartphones, and POS accessories for business management, accessible through structured installment plans.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/60">
                <a
                  href="#services-gadgets"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-action hover:text-action-hover"
                >
                  Explore Gadgets &rarr;
                </a>
              </div>
            </div>

            {/* 4. Land and Estate */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-action">04 • Property</span>
                <h3 className="mt-2 text-lg font-bold text-navy">Land & Estate</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Verified residential, commercial, and agricultural property plots across strategic Northern growth corridors.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/60">
                <a
                  href="#services-land"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-action hover:text-action-hover"
                >
                  Explore Land &rarr;
                </a>
              </div>
            </div>

            {/* 5. Financial Services and Training */}
            <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-action">05 • Agency & Skills</span>
                <h3 className="mt-2 text-lg font-bold text-navy">Financial Services & Training</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  POS terminal setup, BVN and NIN registration, small business bookkeeping consultancy, and hands-on solar installation training.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border/60">
                <a
                  href="#services-finance"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-action hover:text-action-hover"
                >
                  Explore Financial & Training &rarr;
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 3. SOLAR FOR BUSINESS (DEEP-DIVE)                               */}
      {/* ============================================================== */}
      <div id="services-solar" className="scroll-mt-20" />
      <section id="services" className="py-16 md:py-24 scroll-mt-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">Service Overview</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Solar for Business
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Heavy-duty commercial solar installations designed specifically for
                shops, charging kiosks, filling stations, and water production. We
                install the panels, inverters, and lithium storage batteries. You pay in
                small weekly or monthly instalments as your business generates revenue.
              </p>
            </div>
            <div className="lg:col-span-5">
              <ServiceImage imageKey="solar" className="w-full" />
            </div>
          </div>

          {/* 4 Confirmed Commercial Solar Use Cases */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-3.5">
              <h3 className="font-display text-sm font-bold text-navy">
                Commercial Shops
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Continuous refrigeration, lighting, and zero generator runs.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3.5">
              <h3 className="font-display text-sm font-bold text-navy">
                Phone Charging
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Lithium battery reserves for multi-device charging through peak trading.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3.5">
              <h3 className="font-display text-sm font-bold text-navy">
                Filling Stations
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Uninterrupted pump metering, dispensers, and forecourt canopy lighting.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3.5">
              <h3 className="font-display text-sm font-bold text-navy">
                Pure Water Plants
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Daytime power for borehole pumps, filtration, and sachet sealing.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-navy">
            <span>Zero upfront deposit options for eligible commercial solar</span>
            <span className="text-muted-foreground">&bull;</span>
            <span>Technical assessment before installation</span>
            <span className="text-muted-foreground">&bull;</span>
            <span>Terms agreed in writing before signing</span>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {/* 1. Compact Business Solar */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm min-w-0">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-block rounded bg-action-soft px-2.5 py-1 text-xs font-semibold text-action uppercase">
                    Retail & Kiosks
                  </span>
                  <Badge tone="neutral">Site Assessment</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold text-navy">
                  Compact Commercial Solar (3.5kVA Profile)
                </h3>
                <ProductImagePlaceholder
                  category="solar"
                  productName="Compact Commercial Solar (3.5kVA)"
                  className="mt-4 mb-4"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Engineered for phone charging stands, provision kiosks, salons, and POS
                  merchants. Powers multi-device charging, lighting, fans, and point-of-sale systems.
                </p>
                <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-4 text-xs">
                  <div>
                    <span className="font-semibold text-navy">System Profile:</span> 3.5 kVA Pure Sine Wave Inverter, lithium battery storage, high-yield solar array.
                  </div>
                  <div>
                    <span className="font-semibold text-navy">Replaces:</span> Small petrol generator fuel expenditures.
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border bg-background p-3 text-center">
                  <span className="text-xs text-muted-foreground">
                    Indicative Plan from
                  </span>
                  <p className="font-display text-xl font-extrabold text-action">
                    {naira(planSolarCompact.perPayment)} / week
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Over 6 months &bull; Baseline estimate from {naira(850000)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setAppModalData({
                      productName: "Compact Commercial Solar (3.5kVA Profile)",
                      category: "solar",
                      price: 850000,
                      duration: 6,
                      frequency: "weekly",
                    });
                    setAppModalOpen(true);
                  }}
                  className={cn(btn({ variant: "primary", size: "sm" }), "w-full font-semibold")}
                >
                  Request Solar Assessment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProduct({
                      name: "Compact Commercial Solar (3.5kVA Profile)",
                      category: "solar",
                      cash_price: 850000,
                      isAssessment: true,
                      description:
                        "Sized for phone charging stands, provision kiosks, salons, and POS merchants. Powers multi-device charging, LED lighting, fans, and digital point-of-sale systems.",
                      specs: {
                        "System Sizing": "3.5 kVA Pure Sine Wave Inverter",
                        "Energy Storage": "5 kWh Lithium Battery Bank",
                        "Solar Array": "Monocrystalline Rooftop Array",
                        "Charging Capacity": "Multi-Device Commercial Phone Charging",
                        "Generator Replacement": "Replaces small petrol generator fuel expenses",
                        "Assessment Scope": "On-site commercial electrical and load survey included",
                      },
                    })
                  }
                  className={cn(btn({ variant: "secondary", size: "sm" }), "w-full font-semibold text-navy")}
                >
                  View System Profile
                </button>
              </div>
            </div>

            {/* 2. Medium Business Solar */}
            <div className="flex flex-col justify-between rounded-xl border-2 border-navy bg-surface p-5 sm:p-6 shadow-md min-w-0">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-block rounded bg-navy px-2.5 py-1 text-xs font-semibold text-navy-foreground uppercase">
                    Commercial Stores
                  </span>
                  <Badge tone="neutral">Site Assessment</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold text-navy">
                  Medium Commercial Solar (5.0kVA Profile)
                </h3>
                <ProductImagePlaceholder
                  category="solar"
                  productName="Medium Commercial Solar (5.0kVA)"
                  className="mt-4 mb-4"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Designed for provisions stores, cold room counters, clinics, and
                  pharmacies. Powers commercial deep freezers, display chillers,
                  lighting, and POS systems.
                </p>
                <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-4 text-xs">
                  <div>
                    <span className="font-semibold text-navy">System Profile:</span> 5.0 kVA Hybrid Inverter, 10kWh lithium battery bank, commercial solar array.
                  </div>
                  <div>
                    <span className="font-semibold text-navy">Replaces:</span> 2.5kVA generator running 10+ hours daily.
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border bg-background p-3 text-center">
                  <span className="text-xs text-muted-foreground">
                    Indicative Plan from
                  </span>
                  <p className="font-display text-xl font-extrabold text-action">
                    {naira(planSolarMedium.perPayment)} / week
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Over 6 months &bull; Baseline estimate from {naira(1650000)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setAppModalData({
                      productName: "Medium Commercial Solar (5.0kVA Profile)",
                      category: "solar",
                      price: 1650000,
                      duration: 6,
                      frequency: "weekly",
                    });
                    setAppModalOpen(true);
                  }}
                  className={cn(btn({ variant: "primary", size: "sm" }), "w-full font-semibold")}
                >
                  Request Solar Assessment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProduct({
                      name: "Medium Commercial Solar (5.0kVA Profile)",
                      category: "solar",
                      cash_price: 1650000,
                      isAssessment: true,
                      description:
                        "Designed for provisions stores, cold room counters, clinics, and pharmacies. Powers commercial deep freezers, display chillers, lighting, and POS systems.",
                      specs: {
                        "System Sizing": "5.0 kVA Commercial Hybrid Inverter",
                        "Energy Storage": "10 kWh High-Capacity Lithium Bank",
                        "Solar Array": "High-Efficiency Commercial Array",
                        "Equipment Supported": "Commercial refrigeration, cold display, clinics",
                        "Generator Replacement": "Replaces 2.5kVA generator running 10+ hrs daily",
                        "Assessment Scope": "In-person commercial premise load analysis included",
                      },
                    })
                  }
                  className={cn(btn({ variant: "secondary", size: "sm" }), "w-full font-semibold text-navy")}
                >
                  View System Profile
                </button>
              </div>
            </div>

            {/* 3. Heavy Commercial Solar */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm min-w-0">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-block rounded bg-accent px-2.5 py-1 text-xs font-semibold text-navy uppercase">
                    Industrial & Plants
                  </span>
                  <Badge tone="neutral">Site Assessment</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold text-navy">
                  Heavy Commercial Solar (10kVA+ Profile)
                </h3>
                <ProductImagePlaceholder
                  category="solar"
                  productName="Heavy Commercial Solar (10kVA+)"
                  className="mt-4 mb-4"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Engineered for filling stations, pure water bagging factories, and
                  agricultural processing. Drives heavy motor surges, submersible
                  pumps, and sealing units.
                </p>
                <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-4 text-xs">
                  <div>
                    <span className="font-semibold text-navy">System Profile:</span> 10–15kVA+ 3-Phase Inverter, 20kWh+ battery bank, high-yield rooftop array.
                  </div>
                  <div>
                    <span className="font-semibold text-navy">Replaces:</span> Heavy diesel generator fuel and routine mechanical maintenance.
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border bg-background p-3 text-center">
                  <span className="text-xs text-muted-foreground">
                    Custom Engineering
                  </span>
                  <p className="font-display text-xl font-extrabold text-navy">
                    From {naira(3200000)}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Terms: 6 to 12 Months &bull; Site Assessment Required
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setAppModalData({
                      productName: "Heavy Commercial Solar (10kVA+ Profile)",
                      category: "solar",
                      price: 3200000,
                      duration: 12,
                      frequency: "monthly",
                    });
                    setAppModalOpen(true);
                  }}
                  className={cn(btn({ variant: "primary", size: "sm" }), "w-full font-semibold")}
                >
                  Request Solar Assessment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProduct({
                      name: "Heavy Commercial Solar (10kVA+ Profile)",
                      category: "solar",
                      cash_price: 3200000,
                      isAssessment: true,
                      description:
                        "Engineered for filling stations, pure water bagging factories, and agricultural processing. Drives heavy motor surges, submersible pumps, and sealing units.",
                      specs: {
                        "System Sizing": "10 kVA - 15 kVA+ 3-Phase Industrial Inverter",
                        "Energy Storage": "20 kWh - 40 kWh Industrial Lithium Rack",
                        "Solar Array": "16 to 32 High-Output Solar Panels",
                        "Load Capability": "Submersible borehole pumps, sachet sealing, 3-phase machinery",
                        "Generator Replacement": "Replaces heavy diesel genset maintenance & fuel",
                        "Deployment": "On-site commercial engineering and load audit included",
                      },
                    })
                  }
                  className={cn(btn({ variant: "secondary", size: "sm" }), "w-full font-semibold text-navy")}
                >
                  View System Profile
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 3. ELECTRIC MOTORCYCLES AND TRICYCLES                         */}
      {/* ============================================================== */}
      <div id="services-ev" className="scroll-mt-20" />
      <section
        id="electric-vehicles"
        className="border-y border-border bg-surface py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">Commercial Clean Mobility</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Electric Motorcycles & Tricycles
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built for okada riders and keke napep commercial drivers who spend a
                significant portion of daily revenue on fuel. Charge at home from a
                normal socket overnight and eliminate petrol expenses.
              </p>
            </div>
            <div className="lg:col-span-5">
              <ServiceImage imageKey="ev" className="w-full" />
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            {/* Fuel vs Electric Running Cost Calculator */}
            <div id="ev-calculator" className="rounded-xl border border-border bg-background p-6 md:p-8">
              <span className="text-xs font-bold uppercase tracking-wider text-action">
                Running-Cost Comparison
              </span>
              <h3 className="mt-1 text-2xl font-bold text-navy">
                Work out your daily & monthly savings
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Compare what you spend on petrol against estimated electricity
                charging costs for the same operating distance.
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${genId}-fuel-daily`}
                    className="block text-sm font-semibold text-navy"
                  >
                    What you spend on petrol each day (₦)
                  </label>
                  <input
                    id={`${genId}-fuel-daily`}
                    inputMode="numeric"
                    value={evDailyFuel ? evDailyFuel.toLocaleString("en-NG") : ""}
                    onChange={(e) =>
                      setEvDailyFuel(
                        Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0
                      )
                    }
                    className={cn(inputCls, "text-lg font-bold")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${genId}-charge-daily`}
                    className="block text-sm font-semibold text-navy"
                  >
                    Estimated daily electric charging cost (₦)
                  </label>
                  <input
                    id={`${genId}-charge-daily`}
                    inputMode="numeric"
                    value={evDailyCharge ? evDailyCharge.toLocaleString("en-NG") : ""}
                    onChange={(e) =>
                      setEvDailyCharge(
                        Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0
                      )
                    }
                    className={cn(inputCls, "text-lg font-bold")}
                  />
                </div>

                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold text-navy">
                    Days you work each week
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-0">
                    {[4, 5, 6, 7].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEvDaysWorked(d)}
                        className={cn(
                          "h-11 min-h-[44px] min-w-0 rounded-lg border font-semibold text-xs sm:text-sm px-1 transition-colors",
                          evDaysWorked === d
                            ? "border-navy bg-navy text-navy-foreground"
                            : "border-input bg-background text-foreground hover:bg-accent"
                        )}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Petrol Per Week:</span>
                    <p className="font-semibold text-navy">{naira(evWeeklyPetrol)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Petrol Per Month:</span>
                    <p className="font-semibold text-navy">{naira(evMonthlyPetrol)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Charging Per Week:</span>
                    <p className="font-semibold text-navy">{naira(evWeeklyElectric)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Charging Per Month:
                    </span>
                    <p className="font-semibold text-navy">{naira(evMonthlyElectric)}</p>
                  </div>
                </div>

                {/* Explicit Assumption and Disclaimer */}
                <div className="rounded bg-accent/40 p-3 text-xs text-muted-foreground leading-relaxed">
                  <strong>Notice on Energy Comparison:</strong> Calculations are based
                  on user-entered daily expenses ({naira(evDailyFuel)} petrol vs{" "}
                  {naira(evDailyCharge)} charging across {evDaysWorked} workdays/week).
                  Actual energy expenses vary with national grid tariffs, generator
                  fuel rates, battery capacity, rider load, and local road terrain.
                  Energy savings do not constitute guaranteed commercial income.
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-action p-5 text-action-foreground">
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Estimated Monthly Energy Cost Difference
                </span>
                <p className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">
                  {naira(evMonthlySavings)}
                </p>
                <p className="mt-1 text-sm text-action-foreground/90">
                  Potential reduction in energy expenditure based on entered operational estimates.
                </p>
              </div>
            </div>

            {/* Vehicle Fleet Tiers */}
            <div className="space-y-6 min-w-0">
              {/* Okada Card */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <span className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-semibold text-navy">
                    Commercial Okada
                  </span>
                  <Badge tone="neutral">Pilot Allocation</Badge>
                </div>
                <h4 className="mt-2 text-xl font-bold text-navy">
                  E-Motorcycle Delivery & Transit
                </h4>
                <ProductImagePlaceholder
                  category="ev"
                  productName="E-Motorcycle Delivery & Transit"
                  className="mt-3 mb-3"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  High-torque electric motorcycle with reinforced rear carrier, dual
                  battery capacity, and heavy shock absorbers for local road terrains.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>&bull; Range: 80–100 km indicative per charge</li>
                  <li>&bull; Charge Time: 4–5 hours from standard wall plug</li>
                  <li>&bull; No oil changes, no spark plugs, low motor noise</li>
                </ul>

                <div className="mt-4 rounded-md border border-border bg-surface p-3 text-center">
                  <span className="text-xs text-muted-foreground">
                    Indicative Pilot Estimate
                  </span>
                  <p className="font-display text-xl font-extrabold text-action">
                    {naira(planEvOkada.perPayment)} / week
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Approx. 6 months &bull; Baseline reference: {naira(950000)}
                  </span>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAppModalData({
                        productName: "E-Motorcycle Delivery & Transit (Pilot Assessment)",
                        category: "ev",
                        price: 950000,
                        duration: 6,
                        frequency: "weekly",
                      });
                      setAppModalOpen(true);
                    }}
                    className={cn(btn({ variant: "primary", size: "sm" }), "flex-1 font-semibold")}
                  >
                    Apply for Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct({
                        name: "E-Motorcycle Delivery & Transit",
                        category: "ev",
                        cash_price: 950000,
                        isAssessment: true,
                        description:
                          "High-torque commercial electric motorcycle designed for courier and transport operations. Indicative specs based on pilot models.",
                        specs: {
                          "Operating Range": "80–100 km indicative per full charge",
                          "Charge Time": "4–5 hours from standard 220V wall socket",
                          "Battery System": "72V 35Ah Lithium Removable Pack",
                          "Motor Output": "2.5 kW High-Torque Brushless Hub",
                          "Payload Capacity": "Reinforced 180 kg rear rack payload",
                          "Maintenance": "Low mechanical wear, no engine oil, no spark plugs",
                        },
                      })
                    }
                    className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                  >
                    Indicative Scope
                  </button>
                  {hasRealWhatsApp && (
                    <a
                      href={wa("E-Motorcycle commercial inquiry")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btn({ variant: "navy", size: "sm" }), "font-semibold")}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Keke Card */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <span className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-semibold text-navy">
                    Commercial Keke
                  </span>
                  <Badge tone="neutral">Fleet Pilot Intake</Badge>
                </div>
                <h4 className="mt-2 text-xl font-bold text-navy">
                  E-Tricycle Passenger & Cargo
                </h4>
                <ProductImagePlaceholder
                  category="ev"
                  productName="E-Tricycle Passenger & Cargo"
                  className="mt-3 mb-3"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Heavy passenger tricycle accommodating driver plus passengers or
                  traders cargo. Robust chassis and direct shaft transmission.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>&bull; Range: 70–90 km indicative per charge</li>
                  <li>&bull; Regenerative braking and digital battery meter</li>
                  <li>&bull; Routine brake and tyre servicing support included</li>
                </ul>

                <div className="mt-4 rounded-md border border-border bg-surface p-3 text-center">
                  <span className="text-xs text-muted-foreground">
                    Indicative Pilot Estimate
                  </span>
                  <p className="font-display text-xl font-extrabold text-action">
                    {naira(planEvKeke.perPayment)} / week
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Approx. 12 months &bull; Baseline reference: {naira(2150000)}
                  </span>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAppModalData({
                        productName: "E-Tricycle Passenger & Cargo (Pilot Assessment)",
                        category: "ev",
                        price: 2150000,
                        duration: 12,
                        frequency: "weekly",
                      });
                      setAppModalOpen(true);
                    }}
                    className={cn(btn({ variant: "primary", size: "sm" }), "flex-1 font-semibold")}
                  >
                    Apply for Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct({
                        name: "E-Tricycle Passenger & Cargo",
                        category: "ev",
                        cash_price: 2150000,
                        isAssessment: true,
                        description:
                          "Heavy commercial passenger and cargo tricycle. Robust chassis and direct shaft transmission. Indicative specs based on pilot allocation.",
                        specs: {
                          "Operating Range": "70–90 km indicative per full charge",
                          "Capacity": "Driver + passengers or up to 350 kg cargo",
                          "Battery System": "Dual 60V 50Ah LiFePO4 battery pack",
                          "Transmission": "Direct shaft drive with reverse gear",
                          "Braking System": "Regenerative braking with digital battery state",
                          "Local Service": "Brake, tyre, and electrical inspection in Kaduna",
                        },
                      })
                    }
                    className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                  >
                    Indicative Scope
                  </button>
                  {hasRealWhatsApp && (
                    <a
                      href={wa("E-Tricycle passenger keke inquiry")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btn({ variant: "navy", size: "sm" }), "font-semibold")}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 4. PHONES AND GADGETS CATALOGUE                                */}
      {/* ============================================================== */}
      <div id="services-gadgets" className="scroll-mt-20" />
      <section id="phones-and-gadgets" className="py-16 md:py-24 scroll-mt-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">Product Catalogue</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Phones, Laptops & Essential Gadgets
              </h2>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                Original devices from authorized distributors. Pay in structured
                weekly or monthly instalments with confirmed terms.
              </p>
            </div>
            <div className="lg:col-span-5">
              <ServiceImage imageKey="gadgets" className="w-full" />
            </div>
          </div>

          {/* Subcategory Filter Tabs */}
          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-border pt-6">
            {([
              ["all", "All Devices"],
              ["phones", "Phones"],
              ["laptops", "Laptops"],
              ["tablets", "Tablets"],
              ["power_banks", "Power Banks"],
              ["accessories", "Accessories"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGadgetFilter(key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  gadgetFilter === key
                    ? "border-navy bg-navy text-navy-foreground"
                    : "border-input bg-surface text-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {isProductsLoading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-border bg-surface p-5 space-y-4"
                >
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="aspect-[16/10] bg-muted rounded-lg" />
                  <div className="h-14 bg-muted rounded-md" />
                  <div className="h-9 bg-muted rounded-md" />
                </div>
              ))}
            </div>
          ) : isProductsError ? (
            <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="font-semibold text-destructive">
                Unable to load product catalogue.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please check your network connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetchProducts()}
                className={cn(btn({ variant: "secondary", size: "sm" }), "mt-3 font-semibold")}
              >
                Retry Loading Products
              </button>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {gadgetProducts.length > 0 ? (
                gadgetProducts.map((p) => {
                  const plan6 = calculatePlan({
                    price: p.cash_price,
                    months: 6,
                    frequency: "weekly",
                    markups,
                  });

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            {p.brand ?? p.category}
                          </span>
                          <Badge tone="good">In Stock</Badge>
                        </div>

                        <h3 className="mt-2 font-display text-lg font-bold text-navy">
                          {p.name}
                        </h3>
                        <CatalogueCardImage
                          src={p.images?.[0]}
                          alt={p.name}
                          category={p.category}
                          productName={p.name}
                        />
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {p.description}
                        </p>

                        <div className="mt-4 rounded-md border border-border bg-background p-3 text-center">
                          <span className="text-xs text-muted-foreground">
                            From approx.
                          </span>
                          <p className="font-display text-xl font-extrabold text-action">
                            {naira(plan6.perPayment)} / week
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            Over 6 months &bull; Cash: {naira(p.cash_price)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2 pt-3 border-t border-border">
                        <button
                          type="button"
                          onClick={() =>
                            openApplyForProduct(
                              {
                                id: p.id,
                                name: p.name,
                                category: p.category,
                                brand: p.brand,
                                cash_price: p.cash_price,
                                description: p.description,
                                specs: p.specs as Record<string, string | number>,
                                in_stock: p.in_stock,
                                images: p.images,
                              },
                              6,
                              "weekly"
                            )
                          }
                          className={cn(btn({ variant: "primary", size: "sm" }), "w-full font-semibold")}
                        >
                          Apply for This
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProduct({
                              id: p.id,
                              name: p.name,
                              category: p.category,
                              brand: p.brand,
                              cash_price: p.cash_price,
                              description: p.description,
                              specs: p.specs as Record<string, string | number>,
                              in_stock: p.in_stock,
                              images: p.images,
                            })
                          }
                          className={cn(
                            btn({ variant: "secondary", size: "sm" }),
                            "w-full font-semibold text-navy"
                          )}
                        >
                          View Specifications
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-input bg-surface p-10 text-center">
                  <p className="font-semibold text-navy">
                    No products published under this category currently.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New inventory is updated regularly. {hasRealWhatsApp ? "Chat on WhatsApp to request specific device models." : "Submit an enquiry to request specific device models."}
                  </p>
                  {hasRealWhatsApp ? (
                    <a
                      href={wa("Inquiring about available phone or gadget stock")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btn({ variant: "secondary", size: "sm" }), "mt-4 font-semibold text-navy")}
                    >
                      Inquire on WhatsApp
                    </a>
                  ) : (
                    <a
                      href="#enquire"
                      className={cn(btn({ variant: "secondary", size: "sm" }), "mt-4 font-semibold text-navy")}
                    >
                      Send an Enquiry
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 5. LAND AND ESTATE LISTINGS & INQUIRY                          */}
      {/* ============================================================== */}
      <div id="services-land" className="scroll-mt-20" />
      <section
        id="land-and-estate"
        className="border-y border-border bg-surface py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">Property Listings</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Land & Estate Property
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Residential and commercial estate plots across Northern Nigeria.
                Document inspection and verified physical site visits are scheduled
                prior to contracting. Spread payments over up to 24 months.
              </p>
            </div>
            <div className="lg:col-span-5">
              <ServiceImage imageKey="land" className="w-full" />
            </div>
          </div>

          {isPlotsLoading ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-border bg-background p-6 space-y-4"
                >
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="aspect-[16/10] bg-muted rounded-lg" />
                  <div className="h-14 bg-muted rounded-md" />
                  <div className="h-9 bg-muted rounded-md" />
                </div>
              ))}
            </div>
          ) : isPlotsError ? (
            <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="font-semibold text-destructive">
                Unable to load land listings.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please check your network connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetchPlots()}
                className={cn(btn({ variant: "secondary", size: "sm" }), "mt-3 font-semibold")}
              >
                Retry Loading Land
              </button>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(allPlots ?? []).length > 0 ? (
                (allPlots ?? []).map((plot) => (
                  <div
                    key={plot.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {plot.town}, {plot.state}
                        </span>
                        <Badge
                          tone={
                            plot.status === "Available"
                              ? "good"
                              : plot.status === "Few left"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {plot.status}
                        </Badge>
                      </div>

                      <h3 className="mt-2 text-xl font-bold text-navy">
                        {plot.estate_name}
                      </h3>
                      {plot.images && plot.images.length > 0 && plot.images[0] ? (
                        <img
                          src={plot.images[0]}
                          alt={plot.estate_name}
                          className="mt-3 mb-2 aspect-[16/10] w-full rounded-lg object-cover border border-border"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <PlotImagePlaceholder
                          estateName={plot.estate_name}
                          town={plot.town}
                          state={plot.state}
                          className="mt-3 mb-2"
                        />
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Size: {plot.size_sqm} sqm &bull; {plot.location_description}
                      </p>

                      <div className="mt-4 rounded-md border border-border bg-surface p-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cash Price:</span>
                          <span className="font-bold text-navy">
                            {naira(plot.cash_price)}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-bold text-action">
                            {plot.plan_summary ??
                              `${naira(plot.monthly_amount ?? 50000)}/mo (${plot.plan_months ?? 24}m)`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="block text-xs font-semibold text-navy">
                          Verified Documents:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(plot.documents ?? ["C of O", "Survey Plan"]).map(
                            (doc) => (
                              <span
                                key={doc}
                                className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground"
                              >
                                {doc}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2 border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setLandPlotId(plot.id);
                          setLandPlotName(plot.estate_name);
                          setLandState(plot.state);
                          setShowLandForm(true);
                          setTimeout(() => {
                            const el = document.getElementById("land-inquiry-box");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }, 50);
                        }}
                        className={cn(btn({ variant: "primary", size: "sm" }), "flex-1 font-semibold")}
                      >
                        Book Site Visit
                      </button>
                      {plot.map_link && (
                        <a
                          href={plot.map_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                        >
                          Map
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-input bg-surface p-8 text-center text-sm text-muted-foreground">
                  No active public land plots listed at this moment. Verified estate
                  plots are added after title inspection.
                </div>
              )}
            </div>
          )}

          {/* Land Inquiry Intake Form */}
          <div
            id="land-inquiry-box"
            className="mt-10 rounded-xl border border-border bg-background p-6 md:p-8 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-action">
                  On-Site Inspection & Verification
                </span>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-navy">
                  Book a Site Visit or Request Land Documents
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We organize accompanied site visits so you can physically inspect
                  the boundaries and examine all documentation with your legal advisor.
                </p>
              </div>
              {!showLandForm && !landSubmitted && (
                <button
                  type="button"
                  onClick={() => setShowLandForm(true)}
                  aria-expanded={showLandForm}
                  aria-controls="land-inquiry-form"
                  className={cn(btn({ variant: "primary", size: "md" }), "shrink-0 font-semibold self-start sm:self-center")}
                >
                  Schedule Site Visit
                </button>
              )}
            </div>

            {landSubmitted ? (
              <div className="mt-6 rounded-lg border border-action bg-action-soft p-5 text-foreground">
                <h4 className="font-bold text-action">Site Visit Request Received</h4>
                <p className="mt-1 text-sm">
                  Thank you, <strong>{landFullName}</strong>. We have logged your
                  request for{" "}
                  <strong>{landPlotName || `Plots in ${landState}`}</strong>.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Our estate coordinator will call you on <strong>{landPhone}</strong>{" "}
                  within 24 hours to schedule your inspection date.
                </p>
              </div>
            ) : showLandForm ? (
              <form id="land-inquiry-form" onSubmit={handleLandInquirySubmit} className="mt-6 space-y-4 border-t border-border pt-6">
                {landError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {landError}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-land-name`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Full Name
                    </label>
                    <input
                      id={`${genId}-land-name`}
                      type="text"
                      required
                      value={landFullName}
                      onChange={(e) => setLandFullName(e.target.value)}
                      placeholder="e.g. Ibrahim Danladi"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-land-phone`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Phone Number
                    </label>
                    <input
                      id={`${genId}-land-phone`}
                      type="tel"
                      required
                      value={landPhone}
                      onChange={(e) => setLandPhone(e.target.value)}
                      placeholder="e.g. 0802 345 6789"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-land-state`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Preferred State
                    </label>
                    <select
                      id={`${genId}-land-state`}
                      value={landState}
                      onChange={(e) => setLandState(e.target.value)}
                      className={cn(inputCls, "cursor-pointer")}
                    >
                      {NORTHERN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-land-plan`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Preferred Payment Plan
                    </label>
                    <select
                      id={`${genId}-land-plan`}
                      value={landPlan}
                      onChange={(e) => setLandPlan(e.target.value)}
                      className={cn(inputCls, "cursor-pointer")}
                    >
                      <option value="Outright Payment">Outright Cash</option>
                      <option value="6 Months Plan">6 Months Plan</option>
                      <option value="12 Months Plan">12 Months Plan</option>
                      <option value="24 Months Plan">24 Months Plan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-land-msg`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Specific Estate / Notes (optional)
                    </label>
                    <input
                      id={`${genId}-land-msg`}
                      type="text"
                      value={landMessage}
                      onChange={(e) => setLandMessage(e.target.value)}
                      placeholder="e.g. Unguwan Rimi, or preferred weekend visit date"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={landSubmitting}
                    className={cn(btn({ variant: "primary", size: "md" }), "w-full sm:w-auto font-semibold")}
                  >
                    {landSubmitting ? "Submitting Request..." : "Schedule Site Visit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLandForm(false)}
                    className={cn(btn({ variant: "secondary", size: "md" }), "w-full sm:w-auto font-semibold text-navy")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 6. FINANCIAL SERVICES AND VOCATIONAL TRAINING                  */}
      {/* ============================================================== */}
      <div id="services-finance" className="scroll-mt-20" />
      <section
        id="financial-services-and-training"
        className="py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="eyebrow">Enterprise Enablement</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Financial Services & Vocational Training
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Practical financial tools and in-person technical skills training
                designed to launch and expand independent businesses.
              </p>
            </div>
            <div className="lg:col-span-5">
              <ServiceImage imageKey="training" className="w-full" />
            </div>
          </div>

          <div className="mt-12 grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-10">
            {/* PART 1: Financial Services */}
            <div className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-6 md:p-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-action">
                Commercial Agency Support
              </span>
              <h3 className="mt-1 text-2xl font-bold text-navy">Financial Services</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Official agent banking enablement and identity enrollment services.
              </p>

              <div className="mt-6 space-y-4">
                <div className="min-w-0 rounded-lg border border-border bg-background p-4">
                  <h4 className="font-bold text-navy">POS & Agent Banking Setup</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acquisition of commercial POS terminals, portal onboarding,
                    float management consultancy, and dispute resolution channels.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-action">
                    What to bring: Valid ID, Utility bill, Passport photo.
                  </p>
                </div>

                <div className="min-w-0 rounded-lg border border-border bg-background p-4">
                  <h4 className="font-bold text-navy">BVN & NIN Services</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New enrollment, biometric updates, phone number linkage, and
                    validation for business operators.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-action">
                    Statutory processing fees only.
                  </p>
                </div>

                <div className="min-w-0 rounded-lg border border-border bg-background p-4">
                  <h4 className="font-bold text-navy">SME Financial Advisory</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cash flow record-keeping, business registration support, and
                    tax identification number (TIN) onboarding.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-md bg-accent/40 p-4 text-xs text-navy">
                <strong className="block text-sm font-bold">Strict Security Notice:</strong>
                S.i and Billionaires Hub Nig.Ltd will NEVER ask for your bank card
                PIN, mobile banking password, or OTP. Keep your authentication
                confidential.
              </div>
            </div>

            {/* PART 2: Vocational Training Courses */}
            <div className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-6 md:p-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-action">
                Hands-On Practical Skills
              </span>
              <h3 className="mt-1 text-2xl font-bold text-navy">
                Vocational Training Courses
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                In-person technical courses held at our Kaduna training centre.
              </p>

              {isCoursesLoading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse min-w-0 rounded-lg border border-border bg-background p-4 space-y-3"
                    >
                      <div className="h-5 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-10 bg-muted rounded" />
                      <div className="h-8 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : isCoursesError ? (
                <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                  <p className="font-semibold text-destructive text-sm">
                    Unable to load vocational courses.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchCourses()}
                    className={cn(btn({ variant: "secondary", size: "sm" }), "mt-2 font-semibold text-xs")}
                  >
                    Retry Loading Courses
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {(allCourses ?? []).map((c) => (
                    <div
                      key={c.id}
                      className="min-w-0 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-navy">{c.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            Duration: {c.duration} &bull; {c.mode}
                          </span>
                        </div>
                        <span className="shrink-0 font-bold text-action">
                          {c.price > 0 ? naira(c.price) : "Subsidized"}
                        </span>
                      </div>

                      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {(c.learn ?? []).map((item) => (
                          <li key={item}>&bull; {item}</li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          {c.seats_left} seats remaining
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTrainCourseId(c.id);
                            setTrainCourseTitle(c.title);
                            const el = document.getElementById("training-form-box");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={cn(btn({ variant: "primary", size: "sm" }), "w-full sm:w-auto font-semibold shrink-0")}
                        >
                          Sign Up for This Course
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Training Registration Form */}
              <div id="training-form-box" className="mt-6 border-t border-border pt-6">
                <h4 className="font-bold text-navy">Course Registration</h4>
                {trainSubmitted ? (
                  <div className="mt-3 rounded-md border border-action bg-action-soft p-4 text-xs">
                    <p className="font-bold text-action">Registration Received</p>
                    <p className="mt-1">
                      Thank you, {trainFullName}. Our training team will contact you on{" "}
                      {trainPhone} with orientation details for {submittedCourseTitle || effectiveCourseTitle}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTrainSubmit} className="mt-3 space-y-3">
                    {trainError && (
                      <div
                        id={`${genId}-train-error`}
                        role="alert"
                        aria-live="polite"
                        className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium"
                      >
                        {trainError}
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor={`${genId}-train-name`}
                          className="block text-xs font-semibold text-navy"
                        >
                          Full Name
                        </label>
                        <input
                          id={`${genId}-train-name`}
                          type="text"
                          required
                          value={trainFullName}
                          onChange={(e) => setTrainFullName(e.target.value)}
                          placeholder="Your Full Name"
                          aria-describedby={trainError ? `${genId}-train-error` : undefined}
                          aria-invalid={Boolean(trainError)}
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor={`${genId}-train-phone`}
                          className="block text-xs font-semibold text-navy"
                        >
                          Phone Number
                        </label>
                        <input
                          id={`${genId}-train-phone`}
                          type="tel"
                          required
                          value={trainPhone}
                          onChange={(e) => setTrainPhone(e.target.value)}
                          placeholder="Phone Number (e.g. 0803...)"
                          aria-describedby={trainError ? `${genId}-train-error` : undefined}
                          aria-invalid={Boolean(trainError)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-train-course`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Select Vocational Course
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          id={`${genId}-train-course`}
                          value={effectiveCourseId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const found = (allCourses ?? []).find(
                              (c) => c.id === val || c.title === val
                            );
                            if (found) {
                              setTrainCourseId(found.id);
                              setTrainCourseTitle(found.title);
                            } else {
                              setTrainCourseId(val);
                              setTrainCourseTitle(val);
                            }
                          }}
                          aria-describedby={trainError ? `${genId}-train-error` : undefined}
                          className={cn(inputCls, "cursor-pointer flex-1")}
                        >
                          {allCourses && allCourses.length > 0 ? (
                            allCourses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title} ({c.duration})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Solar Installation Training">
                                Solar Installation Training
                              </option>
                              <option value="POS Business Training">
                                POS Business Training
                              </option>
                            </>
                          )}
                        </select>
                        <button
                          type="submit"
                          disabled={trainSubmitting}
                          className={cn(btn({ variant: "primary", size: "md" }), "w-full sm:w-auto font-semibold shrink-0")}
                        >
                          {trainSubmitting ? "Submitting..." : "Submit Registration"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 7. AGENT & AMBASSADOR REGISTRATION                             */}
      {/* ============================================================== */}
      <section
        id="become-an-agent"
        className="border-y border-border bg-surface py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Partnership Network</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
              Become an Agent or Ambassador
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join our network representing S.i and Billionaires Hub across Northern
              Nigeria. Expressions of interest are evaluated by our local operations team.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-background p-6">
                <span className="text-xs font-bold uppercase text-navy">
                  Option 1: Commercial Agent
                </span>
                <h3 className="mt-2 text-xl font-bold text-navy">
                  Area Sales Agent
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Serves customers in a town or LGA. Handles customer enquiries,
                  assists with physical premises verification, and facilitates
                  equipment delivery with our technical team.
                </p>
                <p className="mt-3 text-xs font-semibold text-action">
                  Best for: Shop owners, POS operators, and technical merchants.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-6">
                <span className="text-xs font-bold uppercase text-navy">
                  Option 2: Brand Ambassador
                </span>
                <h3 className="mt-2 text-xl font-bold text-navy">
                  Referral Ambassador
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Refers commercial shops, filling stations, riders, and property
                  buyers to our company. Earns a fixed referral commission upon
                  every successful agreement. No physical shop required.
                </p>
                <p className="mt-3 text-xs font-semibold text-action">
                  Best for: Community leaders, riders union reps, and marketers.
                </p>
              </div>

              <div className="rounded-md bg-accent/40 p-4 text-xs text-muted-foreground">
                <strong className="text-navy">What Support We Provide:</strong>{" "}
                Marketing materials, verified product documentation, training on
                system sizing, and direct access to our Kaduna operations desk.
              </div>
            </div>

            {/* Registration Form */}
            <div className="rounded-xl border border-border bg-background p-6 sm:p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-navy">
                Agent / Ambassador Intake
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Join our regional business network representing S.i and Billionaires Hub across Northern Nigeria.
              </p>

              {agentSubmitted ? (
                <div className="mt-6 rounded-lg border border-action bg-action-soft p-5 text-sm">
                  <h4 className="font-bold text-action">Application Logged</h4>
                  <p className="mt-1">
                    Thank you, {agentName}. Your {agentType} application for{" "}
                    {agentTown}, {agentState} has been received.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Our partnership coordinator will contact you on {agentPhone}{" "}
                    within two business days.
                  </p>
                </div>
              ) : !showAgentForm ? (
                <div className="mt-6 rounded-lg border border-border bg-surface p-5 text-center">
                  <p className="text-sm font-semibold text-navy">
                    Submit your expression of interest online
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Our local operations team will review your trade profile and contact you within two business days.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAgentForm(true)}
                    aria-expanded={showAgentForm}
                    aria-controls="agent-intake-form"
                    className={cn(btn({ variant: "primary", size: "md" }), "mt-4 font-semibold")}
                  >
                    Apply to Join Network
                  </button>
                </div>
              ) : (
                <form id="agent-intake-form" onSubmit={handleAgentSubmit} className="mt-6 space-y-4">
                  {agentError && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      {agentError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-name`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Full Name
                      </label>
                      <input
                        id={`${genId}-agent-name`}
                        type="text"
                        required
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. Usman Bello"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-phone`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Phone Number
                      </label>
                      <input
                        id={`${genId}-agent-phone`}
                        type="tel"
                        required
                        value={agentPhone}
                        onChange={(e) => setAgentPhone(e.target.value)}
                        placeholder="e.g. 0806 789 0123"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-state`}
                        className="block text-xs font-semibold text-navy"
                      >
                        State
                      </label>
                      <select
                        id={`${genId}-agent-state`}
                        value={agentState}
                        onChange={(e) => setAgentState(e.target.value)}
                        className={cn(inputCls, "cursor-pointer")}
                      >
                        {NORTHERN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-lga`}
                        className="block text-xs font-semibold text-navy"
                      >
                        LGA
                      </label>
                      <input
                        id={`${genId}-agent-lga`}
                        type="text"
                        required
                        value={agentLga}
                        onChange={(e) => setAgentLga(e.target.value)}
                        placeholder="e.g. Sabon Gari"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-town`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Town
                      </label>
                      <input
                        id={`${genId}-agent-town`}
                        type="text"
                        required
                        value={agentTown}
                        onChange={(e) => setAgentTown(e.target.value)}
                        placeholder="e.g. Zaria"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <fieldset>
                      <legend className="mb-1 text-xs font-semibold text-navy">
                        Role
                      </legend>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAgentType("Agent")}
                          className={cn(
                            "h-11 min-h-[44px] flex-1 rounded-lg border text-xs sm:text-sm font-semibold transition-colors",
                            agentType === "Agent"
                              ? "border-navy bg-navy text-navy-foreground"
                              : "border-input bg-background text-foreground hover:bg-accent"
                          )}
                        >
                          Area Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgentType("Ambassador")}
                          className={cn(
                            "h-11 min-h-[44px] flex-1 rounded-lg border text-xs sm:text-sm font-semibold transition-colors",
                            agentType === "Ambassador"
                              ? "border-navy bg-navy text-navy-foreground"
                              : "border-input bg-background text-foreground hover:bg-accent"
                          )}
                        >
                          Ambassador
                        </button>
                      </div>
                    </fieldset>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-agent-occ`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Current Trade / Occupation
                      </label>
                      <input
                        id={`${genId}-agent-occ`}
                        type="text"
                        required
                        value={agentOccupation}
                        onChange={(e) => setAgentOccupation(e.target.value)}
                        placeholder="e.g. POS operator, provision trader"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id={`${genId}-agent-shop`}
                      type="checkbox"
                      checked={agentHasShop}
                      onChange={(e) => setAgentHasShop(e.target.checked)}
                      className="size-4 rounded border-input text-action accent-[var(--action)]"
                    />
                    <label
                      htmlFor={`${genId}-agent-shop`}
                      className="text-xs text-foreground cursor-pointer"
                    >
                      I have an existing physical shop or business location
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={agentSubmitting}
                      className={cn(btn({ variant: "primary", size: "md" }), "w-full sm:w-auto font-semibold")}
                    >
                      {agentSubmitting
                        ? "Submitting Application..."
                        : "Register as Agent / Ambassador"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAgentForm(false)}
                      className={cn(btn({ variant: "secondary", size: "md" }), "w-full sm:w-auto font-semibold text-navy")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 8. AGENT LOCATOR (FILTERED ACROSS NORTHERN NIGERIA)             */}
      {/* ============================================================== */}
      <section id="agent-locator" className="py-16 md:py-24 scroll-mt-20">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Local Coverage</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
              Find an Approved Agent Near You
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Locate authorized representatives across Northern Nigerian states to
              inspect products, enquire in person, or get assistance with terms.
            </p>
          </div>

          {/* State Selector */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label
              htmlFor={`${genId}-state-select`}
              className="text-sm font-semibold text-navy"
            >
              Filter by State:
            </label>
            <select
              id={`${genId}-state-select`}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className={cn(inputCls, "w-full sm:w-auto sm:min-w-[200px] cursor-pointer font-semibold")}
            >
              {NORTHERN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Results */}
          {isAgentsLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-border bg-surface p-5 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-9 bg-muted rounded mt-2" />
                </div>
              ))}
            </div>
          ) : isAgentsError ? (
            <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="font-semibold text-destructive">
                Unable to load regional agents list.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please check your network connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetchAgents()}
                className={cn(btn({ variant: "secondary", size: "sm" }), "mt-3 font-semibold")}
              >
                Retry Loading Agents
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(approvedAgents ?? []).length > 0 ? (
                (approvedAgents ?? []).map((ag) => (
                  <div
                    key={ag.id}
                    className="rounded-xl border border-border bg-surface p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-action uppercase">
                        Approved {ag.type}
                      </span>
                      <Badge tone="good">Verified</Badge>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-navy">{ag.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {ag.town}, {ag.lga ?? ""}, {ag.state}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 border-t border-border pt-3">
                      {isRealContactNumber(ag.phone) ? (
                        <a
                          href={telLink(ag.phone)}
                          className={cn(
                            btn({ variant: "secondary", size: "sm" }),
                            "flex-1 font-semibold text-navy"
                          )}
                        >
                          Call Agent
                        </a>
                      ) : (
                        <a
                          href="#enquire"
                          className={cn(
                            btn({ variant: "secondary", size: "sm" }),
                            "flex-1 font-semibold text-navy"
                          )}
                        >
                          Enquire via Office
                        </a>
                      )}
                      {isRealContactNumber(ag.whatsapp) && (
                        <a
                          href={waLink(ag.whatsapp, `Hello ${ag.name}, I found your contact on S.i and Billionaires Hub agent directory.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(btn({ variant: "navy", size: "sm" }), "flex-1 font-semibold")}
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-input bg-surface p-8 text-center">
                  <p className="font-semibold text-navy">
                    No public agent registered in {selectedState} yet.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our central office in Kaduna coordinates all deliveries and
                    installations across {selectedState}. You can also apply to become
                    the authorized agent in your area.
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
                    <a
                      href="#become-an-agent"
                      className={cn(btn({ variant: "primary", size: "sm" }), "font-semibold")}
                    >
                      Apply to Become an Agent
                    </a>
                    {hasRealPhone ? (
                      <a
                        href={tel}
                        className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                      >
                        Call Central Office
                      </a>
                    ) : hasRealWhatsApp ? (
                      <a
                        href={wa()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                      >
                        WhatsApp Central Office
                      </a>
                    ) : (
                      <a
                        href="#enquire"
                        className={cn(btn({ variant: "secondary", size: "sm" }), "font-semibold text-navy")}
                      >
                        Contact Central Office
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 9. HOW PAYMENT PLANS WORK & CONFIRMED CALCULATOR               */}
      {/* ============================================================== */}
      <section
        id="how-it-works"
        className="border-y border-border bg-surface py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Payment Plan Structure</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
              Transparent instalment calculation
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Work out weekly or monthly payments based on confirmed company markups.
              Every fee is agreed in writing before equipment delivery.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            {/* Interactive Calculator */}
            <div id="calculator" className="rounded-xl border border-border bg-background p-6 md:p-8">
              <h3 className="text-xl font-bold text-navy">
                Installment Cost Calculator
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter any system or equipment price to view confirmed breakdown.
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor={`${genId}-calc-p`}
                    className="block text-xs font-semibold text-navy"
                  >
                    Equipment Cash Price (₦)
                  </label>
                  <input
                    id={`${genId}-calc-p`}
                    inputMode="numeric"
                    value={calcPriceRaw}
                    aria-invalid={Boolean(calcError || inlinePriceError)}
                    aria-describedby={calcError || inlinePriceError ? `${genId}-calc-error` : undefined}
                    onChange={(e) => {
                      setCalcError(null);
                      setCalcPriceRaw(e.target.value);
                    }}
                    className={cn(inputCls, "text-lg font-bold", (calcError || inlinePriceError) && "border-destructive focus-visible:ring-destructive")}
                  />
                  {(calcError || inlinePriceError) && (
                    <p
                      id={`${genId}-calc-error`}
                      role="alert"
                      aria-live="polite"
                      className="text-xs font-semibold text-destructive mt-1.5"
                    >
                      {calcError || inlinePriceError}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <fieldset>
                    <legend className="mb-1 text-xs font-semibold text-navy">
                      Payment duration
                    </legend>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[3, 6, 9, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCalcDuration(m)}
                          className={cn(
                            "h-11 min-h-[44px] flex-1 rounded-lg border text-xs sm:text-sm font-semibold transition-colors",
                            calcDuration === m
                              ? "border-navy bg-navy text-navy-foreground"
                              : "border-input bg-background text-foreground hover:bg-accent"
                          )}
                        >
                          {m} months
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-1 text-xs font-semibold text-navy">
                      Cadence
                    </legend>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCalcFrequency("weekly")}
                        className={cn(
                          "h-11 min-h-[44px] flex-1 rounded-lg border text-xs sm:text-sm font-semibold transition-colors",
                          calcFrequency === "weekly"
                            ? "border-navy bg-navy text-navy-foreground"
                            : "border-input bg-background text-foreground hover:bg-accent"
                        )}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcFrequency("monthly")}
                        className={cn(
                          "h-11 min-h-[44px] flex-1 rounded-lg border text-xs sm:text-sm font-semibold transition-colors",
                          calcFrequency === "monthly"
                            ? "border-navy bg-navy text-navy-foreground"
                            : "border-input bg-background text-foreground hover:bg-accent"
                        )}
                      >
                        Monthly
                      </button>
                    </div>
                  </fieldset>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor={`${genId}-calc-dep`}
                    className="block text-xs font-semibold text-navy"
                  >
                    Optional Upfront Deposit (₦)
                  </label>
                  <input
                    id={`${genId}-calc-dep`}
                    inputMode="numeric"
                    value={calcDepositRaw}
                    placeholder="0 (Zero deposit available on eligible solar plans)"
                    aria-invalid={Boolean(inlineDepositError)}
                    aria-describedby={inlineDepositError ? `${genId}-calc-dep-error` : undefined}
                    onChange={(e) => {
                      setCalcError(null);
                      setCalcDepositRaw(e.target.value);
                    }}
                    className={cn(inputCls, inlineDepositError && "border-destructive focus-visible:ring-destructive")}
                  />
                  {inlineDepositError && (
                    <p
                      id={`${genId}-calc-dep-error`}
                      role="alert"
                      aria-live="polite"
                      className="text-xs font-semibold text-destructive mt-1.5"
                    >
                      {inlineDepositError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Calculated Breakdown Box */}
            <div className="flex flex-col justify-between rounded-xl bg-navy p-6 md:p-8 text-navy-foreground">
              {planResult ? (
                <div>
                  <span className="text-xs uppercase tracking-wider text-navy-muted">
                    Calculated {calcFrequency === "weekly" ? "Weekly" : "Monthly"}{" "}
                    Installment
                  </span>
                  <p className="mt-2 font-display text-4xl font-extrabold text-navy-foreground sm:text-5xl">
                    {naira(planResult.perPayment)}
                  </p>
                  <p className="mt-1 text-xs text-navy-muted">
                    {planResult.hasDifferentFinalPayment ? (
                      <span>
                        {planResult.payments - 1} payments of {naira(planResult.perPayment)} + 1 final payment of {naira(planResult.finalPayment)} ({calcDuration} months)
                      </span>
                    ) : (
                      <span>
                        Across {planResult.payments} payments of {naira(planResult.perPayment)} ({calcDuration} months)
                      </span>
                    )}
                  </p>

                  <dl className="mt-6 space-y-2 border-t border-navy-foreground/20 pt-4 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <dt className="text-navy-muted">Financed Principal</dt>
                      <dd className="font-semibold">{naira(planResult.financed)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy-muted">Confirmed Markup</dt>
                      <dd className="font-semibold">{planResult.markupPercent}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy-muted">Financing Charge</dt>
                      <dd className="font-semibold">{naira(planResult.extra)}</dd>
                    </div>
                    {planResult.hasDifferentFinalPayment && (
                      <div className="flex justify-between text-navy-muted">
                        <dt>Adjusted Final Payment</dt>
                        <dd className="font-semibold text-navy-foreground">{naira(planResult.finalPayment)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-navy-foreground/20 pt-2 font-bold text-action-foreground text-sm">
                      <dt>Total Repayable</dt>
                      <dd>{naira(planResult.total)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div role="alert" className="p-4 rounded-xl bg-navy/60 border border-navy-foreground/20 text-navy-muted text-sm space-y-2">
                  <p className="font-bold text-action text-base">Financing Calculation Paused</p>
                  <p className="text-xs text-navy-foreground">
                    {inlineDepositError || inlinePriceError || "Enter a positive equipment cash price and an upfront deposit less than the cash price to calculate terms."}
                  </p>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-navy-foreground/20">
                <button
                  type="button"
                  onClick={() => {
                    if (inlinePriceError || priceVal <= 0 || !Number.isFinite(priceVal)) {
                      setCalcError("Please enter a valid positive equipment price to proceed with an application.");
                      const inputEl = document.getElementById(`${genId}-calc-p`);
                      inputEl?.focus();
                      return;
                    }
                    if (inlineDepositError || depositVal >= priceVal) {
                      setCalcError("Optional upfront deposit must be less than the total equipment cash price.");
                      const depEl = document.getElementById(`${genId}-calc-dep`);
                      depEl?.focus();
                      return;
                    }
                    if (!planResult) {
                      setCalcError("Please enter valid financing terms to proceed with an application.");
                      return;
                    }
                    setCalcError(null);
                    setAppModalData({
                      productName: "Custom Equipment Financed Plan",
                      category: "solar",
                      price: priceVal,
                      duration: calcDuration,
                      frequency: calcFrequency,
                      deposit: depositVal,
                    });
                    setAppModalOpen(true);
                  }}
                  className={cn(btn({ variant: "primary" }), "w-full font-semibold")}
                >
                  Apply with These Terms
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 10. APPROVED PROOF, TESTIMONIALS & QUALITY COMMITMENTS         */}
      {/* ============================================================== */}
      {hasApprovedEvidence && (
        <section id="proof" className="py-16 md:py-24 scroll-mt-20">
          <Container>
            <div className="max-w-3xl">
              <p className="eyebrow">Field Standards & Verification</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Authentic installation records
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Verified customer projects and technical records from our field operations.
              </p>
            </div>

            {/* Genuine Approved Testimonials (only when verified records exist) */}
            {approvedTestimonials && approvedTestimonials.length > 0 && (
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {approvedTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-surface p-6 shadow-sm"
                  >
                    <blockquote className="text-base font-medium leading-relaxed text-navy">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      <strong className="text-navy">{t.name}</strong> &bull;{" "}
                      {t.business}, {t.state}
                    </figcaption>
                  </div>
                ))}
              </div>
            )}

            {/* Genuine Media Gallery (only when valid media exists) */}
            {validGalleryItems.length > 0 && (
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {validGalleryItems.map((g) => {
                  const hasImage = Boolean(g.image?.trim());
                  const hasVideo = Boolean(g.video_url?.trim());
                  const isDirect = hasVideo && isDirectVideo(g.video_url);

                  return (
                    <div
                      key={g.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xs"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        {isDirect ? (
                          <video
                            src={g.video_url!}
                            poster={hasImage ? g.image! : undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="size-full object-cover bg-black"
                            aria-label={g.caption ?? "Installation video recording"}
                          >
                            Your browser does not support HTML5 video.
                          </video>
                        ) : hasVideo && hasImage ? (
                          <div className="relative size-full">
                            <img
                              src={g.image!}
                              alt={g.caption ?? "Company verified installation photograph"}
                              loading="lazy"
                              decoding="async"
                              width={600}
                              height={450}
                              className="size-full object-cover"
                            />
                            <a
                              href={g.video_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-white"
                              aria-label={
                                g.caption
                                  ? `Watch installation video: ${g.caption}`
                                  : "Watch installation video"
                              }
                            >
                              <span className="flex items-center gap-2 rounded-full bg-navy/95 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-xs">
                                <svg
                                  className="size-4 fill-white"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                Watch Video
                              </span>
                            </a>
                          </div>
                        ) : hasVideo ? (
                          <a
                            href={g.video_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex size-full flex-col items-center justify-center bg-navy p-6 text-center text-white transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-ring"
                            aria-label={
                              g.caption
                                ? `Watch installation video: ${g.caption}`
                                : "Watch installation video"
                            }
                          >
                            <div className="mb-3 rounded-full bg-white/10 p-3.5 shadow-xs">
                              <svg
                                className="size-7 fill-white"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold">
                              Watch Installation Video
                            </span>
                            <span className="mt-1 text-xs text-white/70">
                              External video link
                            </span>
                          </a>
                        ) : hasImage ? (
                          <img
                            src={g.image!}
                            alt={g.caption ?? "Company verified installation photograph"}
                            loading="lazy"
                            decoding="async"
                            width={600}
                            height={450}
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      {g.caption && (
                        <p className="border-t border-border p-3.5 text-xs text-muted-foreground leading-normal">
                          {g.caption}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Container>
        </section>
      )}

      {/* ============================================================== */}
      {/* 11. ABOUT SECTION                                              */}
      {/* ============================================================== */}
      <section
        id="about"
        className="border-y border-border bg-surface py-16 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">About the Company</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Powering productive enterprise across Northern Nigeria
              </h2>

              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                S.i and Billionaires Hub Nig.Ltd is an indigenous commercial
                technology and renewable energy enterprise operating across
                Northern Nigeria.
              </p>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Coordinating operations from Kaduna, we provide structured equipment
                financing to eliminate energy and operational bottlenecks for retail shops,
                charging kiosks, transport operators, and light manufacturing enterprises
                under clear installment agreements agreed in writing, including zero-deposit
                options on eligible commercial solar plans.
              </p>

              <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
                <span className="font-semibold text-navy">Regional Operations:</span>{" "}
                {company.address}
                <br />
                <span className="font-semibold text-navy">Corporate Verification:</span>{" "}
                {company.rcNumber || "Corporate documentation verified upon formal contract execution."} &bull; Serving Northern Nigeria.
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-6 md:p-8">
              <h3 className="text-lg font-bold text-navy">
                Core Principles & Commitments
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-action">&bull;</span>
                  <span>
                    <strong className="text-foreground">Full Price Transparency:</strong>{" "}
                    Every weekly or monthly payment is agreed in writing before
                    equipment is installed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-action">&bull;</span>
                  <span>
                    <strong className="text-foreground">Strict Data Protection:</strong>{" "}
                    We never ask for your online banking password, ATM PIN, or BVN
                    online.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-action">&bull;</span>
                  <span>
                    <strong className="text-foreground">Official Accounts Only:</strong>{" "}
                    All remittances are made exclusively into corporate bank
                    accounts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-action">&bull;</span>
                  <span>
                    <strong className="text-foreground">Title Handover:</strong> Full
                    legal ownership transfers upon your final scheduled payment with a
                    formal completion certificate.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 12. USEFUL, ACCESSIBLE FAQS                                    */}
      {/* ============================================================== */}
      <section id="faq" className="py-16 md:py-24 scroll-mt-20">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Frequently Asked Questions</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
              Practical answers to client questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Straightforward answers regarding equipment ownership, payments,
              warranties, and land verification.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>Who owns the solar system during the payment period?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                S.i and Billionaires Hub Nig.Ltd holds legal title to the equipment
                during your active repayment period. Once your final scheduled
                instalment is completed, complete legal ownership transfers to you,
                and we deliver a formal certificate of ownership.
              </p>
            </details>

            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>What happens if my business experiences an unexpected cash delay?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                Contact our accounts desk prior to your scheduled payment date. When
                clients communicate in advance, we work together on an adjusted
                settlement date. In cases of uncommunicated non-payment, systems can
                be remotely suspended until arrears are cleared.
              </p>
            </details>

            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>What warranties come with commercial solar equipment?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                Commercial solar systems are backed by original equipment manufacturer
                warranties on solar panels, lithium storage batteries, and hybrid inverters.
                Detailed warranty durations and claim support procedures are specified in
                writing in your formal supply agreement prior to installation.
              </p>
            </details>

            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>Will anyone ask for my BVN or bank PIN?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                Never. We never ask for your ATM PIN, online banking password, or BVN
                code online or in person. All repayments are made strictly into
                verified company bank accounts.
              </p>
            </details>

            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>Can I verify land titles and beacons before paying?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                Yes. Full transparency is our standard. You inspect all statutory
                documents (Survey Plans, Deeds of Assignment, and relevant C of O)
                and attend an accompanied physical inspection before making any
                financial commitment.
              </p>
            </details>

            <details className="group rounded-lg border border-border bg-surface p-5 transition-colors open:bg-accent/30">
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-navy outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
                <span>How can I register for vocational training or become an agent?</span>
                <span className="ml-4 text-xs font-semibold text-action uppercase tracking-wider group-open:hidden">
                  Show Answer
                </span>
                <span className="ml-4 hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider group-open:inline">
                  Hide Answer
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border pt-4">
                Use the dedicated training or agent registration forms in their
                respective sections above, or submit your details in the contact form
                below. Our Kaduna coordinator will reach out within one business day.
              </p>
            </details>
          </div>
        </Container>
      </section>

      {/* ============================================================== */}
      {/* 13. UNIFIED CONTACT & GENERAL ENQUIRY SECTION                  */}
      {/* ============================================================== */}
      <section
        id="enquire"
        className="border-t border-border bg-surface pt-16 pb-28 md:py-24 scroll-mt-20"
      >
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="eyebrow">General Enquiries</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
                Speak with our Kaduna office
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Have specific commercial solar requirements or general questions?
                Send us a message, or contact our team directly via phone or
                WhatsApp.
              </p>

              <div className="mt-8 space-y-4 rounded-xl border border-border bg-background p-6">
                <h3 className="font-bold text-navy">Direct Contact Lines</h3>

                <div className="flex flex-col gap-3 pt-2">
                  {hasRealPhone && (
                    <a
                      href={tel}
                      className={cn(btn({ variant: "secondary" }), "font-semibold text-navy")}
                    >
                      Call {company.phone}
                    </a>
                  )}

                  {hasRealWhatsApp ? (
                    <a
                      href={wa()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btn({ variant: "navy" }), "font-semibold")}
                    >
                      Chat on WhatsApp
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Direct phone and WhatsApp channels are pending final carrier allocation. Please submit your request using the enquiry form.
                    </p>
                  )}
                </div>

                <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                  <p>
                    <strong className="text-navy">Business Hours:</strong>{" "}
                    {company.hours}
                  </p>
                  <p className="mt-1">
                    <strong className="text-navy">Office Address:</strong>{" "}
                    {company.address}
                  </p>
                </div>
              </div>
            </div>

            {/* General Enquiry Form */}
            <div className="rounded-xl border border-border bg-background p-6 sm:p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-navy">Send an Enquiry</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We review submissions daily and respond within one business day.
              </p>

              {enqSubmitted ? (
                <div className="mt-6 rounded-lg border border-action bg-action-soft p-5 text-sm">
                  <h4 className="font-bold text-action">Enquiry Submitted</h4>
                  <p className="mt-1">
                    Thank you, {enqName}. We have received your message regarding{" "}
                    {enqCategory}.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Our team will contact you on {enqPhone} within one working day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleGeneralEnquirySubmit} className="mt-6 space-y-4">
                  {enqError && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      {enqError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-enq-cat`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Subject / Service Area
                    </label>
                    <select
                      id={`${genId}-enq-cat`}
                      value={enqCategory}
                      onChange={(e) => setEnqCategory(e.target.value)}
                      className={cn(inputCls, "cursor-pointer")}
                    >
                      <option value="Solar for Business">Solar for Business</option>
                      <option value="Electric Vehicles">Electric Vehicles</option>
                      <option value="Phones and Gadgets">Phones and Gadgets</option>
                      <option value="Land and Estate">Land and Estate</option>
                      <option value="Financial Services & Training">
                        Financial Services & Training
                      </option>
                      <option value="Agent Partnership">Agent Partnership</option>
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-enq-name`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Full Name
                      </label>
                      <input
                        id={`${genId}-enq-name`}
                        type="text"
                        required
                        value={enqName}
                        onChange={(e) => setEnqName(e.target.value)}
                        placeholder="e.g. Aliyu Mohammed"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-enq-phone`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Phone Number
                      </label>
                      <input
                        id={`${genId}-enq-phone`}
                        type="tel"
                        required
                        value={enqPhone}
                        onChange={(e) => setEnqPhone(e.target.value)}
                        placeholder="e.g. 0803 123 4567"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-enq-state`}
                        className="block text-xs font-semibold text-navy"
                      >
                        State
                      </label>
                      <select
                        id={`${genId}-enq-state`}
                        value={enqState}
                        onChange={(e) => setEnqState(e.target.value)}
                        className={cn(inputCls, "cursor-pointer")}
                      >
                        {NORTHERN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                        <option value="Other">Other State</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`${genId}-enq-town`}
                        className="block text-xs font-semibold text-navy"
                      >
                        Town or City
                      </label>
                      <input
                        id={`${genId}-enq-town`}
                        type="text"
                        value={enqTown}
                        onChange={(e) => setEnqTown(e.target.value)}
                        placeholder="e.g. Kaduna, Zaria, Kano"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`${genId}-enq-msg`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Message or Requirements
                    </label>
                    <textarea
                      id={`${genId}-enq-msg`}
                      rows={3}
                      required
                      value={enqMessage}
                      onChange={(e) => setEnqMessage(e.target.value)}
                      placeholder="Tell us what you want to power or ask any specific questions."
                      className={cn(inputCls, "h-auto min-h-[100px] py-3")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enqSubmitting}
                    className={cn(btn({ variant: "primary", size: "lg" }), "w-full font-semibold")}
                  >
                    {enqSubmitting ? "Submitting..." : "Send Enquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Global Application Modal */}
      <ApplicationModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        initialData={appModalData}
      />

      {/* Global Product Detail Panel */}
      <ProductDetailPanel
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onApply={(prod, dur, freq) => openApplyForProduct(prod, dur, freq)}
      />
    </div>
  );
}
