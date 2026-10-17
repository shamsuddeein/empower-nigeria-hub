import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactBar } from "@/components/site/ContactBar";
import { AdminLogin } from "@/components/admin/AdminLogin";
import * as DataModule from "@/lib/data";

// Mock router state
vi.mock("@tanstack/react-router", () => ({
  useRouterState: vi.fn(() => "/"),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

describe("ContactBar & AdminLogin Polish Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ContactBar Requirements", () => {
    it("renders nothing when genuine contact details are not configured", () => {
      vi.spyOn(DataModule, "useCompany").mockReturnValue({
        company: {} as any,
        hasRealPhone: false,
        hasRealWhatsApp: false,
        tel: "#enquire",
        wa: () => "#enquire",
      });

      const { container } = render(<ContactBar />);
      expect(container.firstChild).toBeNull();
      // Ensure no fallback 'Submit Enquiry' button or fixed bar is rendered
      expect(screen.queryByText("Submit Enquiry")).not.toBeInTheDocument();
    });

    it("renders floating actions when genuine contact details are configured", () => {
      vi.spyOn(DataModule, "useCompany").mockReturnValue({
        company: {} as any,
        hasRealPhone: true,
        hasRealWhatsApp: true,
        tel: "tel:+2348000000000",
        wa: () => "https://wa.me/2348000000000",
      });

      render(<ContactBar />);
      const callLink = screen.getByLabelText("Call Us");
      const waLink = screen.getByLabelText("Chat on WhatsApp");
      expect(callLink).toBeInTheDocument();
      expect(waLink).toBeInTheDocument();
      expect(callLink).toHaveAttribute("href", "tel:+2348000000000");
      expect(waLink).toHaveAttribute("href", "https://wa.me/2348000000000");
    });
  });

  describe("AdminLogin Component Polish", () => {
    it("renders centered card with persistent labels and 48px controls", () => {
      render(<AdminLogin onSuccess={() => {}} />);

      // Heading and branding
      expect(screen.getByText("Staff Administration Portal")).toBeInTheDocument();
      
      // Persistent labels
      expect(screen.getByLabelText("Staff Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();

      // Inputs have text-base (16px) and h-12 (48px)
      const emailInput = screen.getByLabelText("Staff Email Address");
      expect(emailInput).toHaveClass("text-base");
      expect(emailInput).toHaveClass("h-12");

      const passInput = screen.getByLabelText("Password");
      expect(passInput).toHaveClass("text-base");
      expect(passInput).toHaveClass("h-12");

      // Submit button has 48px height, navy variant, and readable text
      const submitBtn = screen.getByRole("button", { name: /Sign In to Admin Portal/i });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toHaveClass("h-12");
      expect(submitBtn).toHaveClass("bg-navy");
      expect(submitBtn).toHaveClass("text-navy-foreground");
    });
  });
});
