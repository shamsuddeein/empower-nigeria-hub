import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { fireEvent } from "@testing-library/react";
import {
  ENQUIRY_TOPICS,
  PRODUCT_CATEGORIES,
  matchesEnquiryTopic,
  matchesProductCategory,
  normalizeTopicId,
  normalizeProductCategory,
} from "@/lib/taxonomy";
import { calculatePlan } from "@/lib/installments";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { AdminApplications } from "@/components/admin/AdminApplications";
import { AdminProducts } from "@/components/admin/AdminProducts";
import * as AdminFunctions from "@/server/functions/adminFunctions";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { ApplicationModal } from "@/components/site/ApplicationModal";
import * as AuthClient from "@/lib/auth-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Better Auth Client
vi.mock("@/lib/auth-client", () => {
  const getSessionMock = vi.fn();
  const signInMock = { email: vi.fn() };
  const signOutMock = vi.fn().mockResolvedValue({ error: null });

  return {
    authClient: {
      getSession: getSessionMock,
      signIn: signInMock,
      signOut: signOutMock,
    },
    getSession: getSessionMock,
    signIn: signInMock,
    signOut: signOutMock,
  };
});

describe("Refinement Verification: Requirements 1 through 9", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.style.overflow = "";
  });

  const render = (ui: React.ReactElement) => {
    act(() => {
      root.render(ui);
    });
  };

  describe("Requirement 1: Accessible Application Status Actions & Atomicity", () => {
    const mockApp = {
      id: "app-test-101",
      reference: "SIB-20261018-9999",
      full_name: "Amina Yusuf",
      phone: "08031234567",
      status: "New",
      category: "solar",
      product_name: "3.5kVA Business Solar Inverter",
      price: 850000,
      deposit: 0,
      charges: 0,
      duration: 6,
      frequency: "weekly",
      payment_count: 26,
      payment_amount: 38600,
      final_payment_amount: 38000,
      total_amount: 1003000,
      notes: "Initial premise check scheduled",
      created_at: new Date().toISOString(),
    };

    it("displays authoritative financing breakdown terms in the inspector", async () => {
      vi.spyOn(AdminFunctions, "listAdminApplicationsFn").mockResolvedValue([mockApp] as any);

      render(<AdminApplications />);
      // Allow async load
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Click on Inspect button to open the application inspector
      const inspectBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Inspect"
      );
      expect(inspectBtn).toBeDefined();
      act(() => {
        inspectBtn?.click();
      });

      // Verify inspector displays applicant details and reference
      expect(container.textContent).toContain("SIB-20261018-9999");
      expect(container.textContent).toContain("Amina Yusuf");

      // Verify authoritative stored terms are rendered
      expect(container.textContent).toContain("₦850,000"); // Cash price
      expect(container.textContent).toContain("6 Months"); // Duration
      expect(container.textContent?.toLowerCase()).toContain("weekly"); // Frequency
      expect(container.textContent).toContain("26 Payments"); // Payment count
      expect(container.textContent).toContain("₦38,600"); // Regular payment
      expect(container.textContent).toContain("₦38,000"); // Adjusted final payment
      expect(container.textContent).toContain("₦1,003,000"); // Total repayable
    });

    it("opens accessible confirmation dialog before status mutation and cancels with zero mutations", async () => {
      vi.spyOn(AdminFunctions, "listAdminApplicationsFn").mockResolvedValue([mockApp] as any);
      const updateMock = vi.spyOn(AdminFunctions, "updateApplicationStatusFn").mockResolvedValue({
        success: true,
        currentStatus: "Approved",
      } as any);

      render(<AdminApplications />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Open inspector
      const inspectBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Inspect"
      );
      act(() => {
        inspectBtn?.click();
      });

      // Find 'Approve Application' action button
      const approveBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Approve Application"
      );
      expect(approveBtn).toBeDefined();

      // Click Approve - must open confirmation panel instead of immediately mutating
      act(() => {
        approveBtn?.click();
      });

      expect(updateMock).not.toHaveBeenCalled();

      // Check confirmation panel contents
      const confirmPanel = container.querySelector('[role="alertdialog"]');
      expect(confirmPanel).not.toBeNull();
      expect(confirmPanel?.textContent).toContain("Confirm Status Change");
      expect(confirmPanel?.textContent).toContain("Amina Yusuf");
      expect(confirmPanel?.textContent).toContain("SIB-20261018-9999");
      expect(confirmPanel?.textContent).toContain("New");
      expect(confirmPanel?.textContent).toContain("Approved");

      // Click Cancel
      const cancelBtn = Array.from(confirmPanel?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Cancel"
      );
      expect(cancelBtn).toBeDefined();

      act(() => {
        cancelBtn?.click();
      });

      // Zero mutations sent
      expect(updateMock).not.toHaveBeenCalled();
      expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    });

    it("submits atomic status and notes update and synchronizes active filtered queue", async () => {
      vi.spyOn(AdminFunctions, "listAdminApplicationsFn").mockResolvedValue([mockApp] as any);
      const updateMock = vi.spyOn(AdminFunctions, "updateApplicationStatusFn").mockResolvedValue({
        success: true,
        currentStatus: "Rejected",
      } as any);

      render(<AdminApplications />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Switch active filter to 'New' via the status dropdown
      const statusSelect = container.querySelector("#app-status-filter") as HTMLSelectElement;
      expect(statusSelect).not.toBeNull();
      act(() => {
        fireEvent.change(statusSelect, { target: { value: "New" } });
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(container.textContent).toContain("Amina Yusuf");

      // Open inspector
      const inspectBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Inspect"
      );
      act(() => {
        inspectBtn?.click();
      });

      // Edit staff notes in the textarea using fireEvent.change
      const textarea = container.querySelector("#inspector-staff-notes") as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      act(() => {
        fireEvent.change(textarea, {
          target: { value: "Applicant shop address verification failed" },
        });
      });

      // Click Reject Application
      const rejectBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Reject Application"
      );
      expect(rejectBtn).toBeDefined();
      act(() => {
        rejectBtn?.click();
      });

      // Confirm in panel
      const confirmPanel = container.querySelector('[role="alertdialog"]');
      expect(confirmPanel).not.toBeNull();
      const confirmBtn = Array.from(confirmPanel?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Confirm Rejected"
      );
      expect(confirmBtn).toBeDefined();

      await act(async () => {
        confirmBtn?.click();
      });

      // Verify single atomic call with id, status, and updated notes
      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "app-test-101",
          status: "Rejected",
          notes: "Applicant shop address verification failed",
        }),
      });

      // Close the inspector dialog
      const closeDialogBtn = container.querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement;
      expect(closeDialogBtn).not.toBeNull();
      act(() => {
        closeDialogBtn?.click();
      });

      // Active filter is 'New' -> rejected record must be removed from the filtered queue immediately
      expect(container.textContent).not.toContain("Amina Yusuf");
      expect(container.textContent).toContain("No applications found");
    });
  });

  describe("Requirement 2: Enquiry Topic Matching & Product Category Aliases", () => {
    it("matches all six public enquiry topics to their canonical filter and All Topics", () => {
      const publicTopics = [
        { publicString: "Solar for Business", canonical: "solar" },
        { publicString: "Electric Vehicles", canonical: "ev" },
        { publicString: "Phones and Gadgets", canonical: "gadgets" },
        { publicString: "Land and Estate", canonical: "land" },
        { publicString: "Financial Services & Training", canonical: "training" },
        { publicString: "Agent Partnership", canonical: "agent" },
      ];

      for (const { publicString, canonical } of publicTopics) {
        // Matches "all"
        expect(matchesEnquiryTopic(publicString, "all")).toBe(true);
        // Matches exact canonical filter
        expect(matchesEnquiryTopic(publicString, canonical)).toBe(true);
        // Does not match unrelated canonical filter
        const otherCanonical = canonical === "solar" ? "ev" : "solar";
        expect(matchesEnquiryTopic(publicString, otherCanonical)).toBe(false);
      }
    });

    it("normalizes product category aliases consistently", () => {
      // Both "phone" and "phones" match the "phones" category filter and "all"
      expect(matchesProductCategory("phones", "phones")).toBe(true);
      expect(matchesProductCategory("phone", "phones")).toBe(true);
      expect(matchesProductCategory("mobile", "phones")).toBe(true);
      expect(matchesProductCategory("smartphones", "phones")).toBe(true);

      expect(matchesProductCategory("phones", "all")).toBe(true);
      expect(matchesProductCategory("phone", "all")).toBe(true);

      // Does not match other categories
      expect(matchesProductCategory("phones", "solar")).toBe(false);
      expect(matchesProductCategory("phone", "ev")).toBe(false);

      // Normalization helpers
      expect(normalizeProductCategory("phone")).toBe("phones");
      expect(normalizeProductCategory("smartphones")).toBe("phones");
      expect(normalizeProductCategory("solar")).toBe("solar");
    });
  });

  describe("Requirement 3: Calculator Validation & Reconciled Schedule", () => {
    it("calculates exact reconciled installment arithmetic with adjusted final payment", () => {
      // NGN 850,000, 6 months (18% markup), weekly
      const plan = calculatePlan({
        price: 850000,
        months: 6,
        frequency: "weekly",
      });

      expect(plan.markupPercent).toBe(18);
      expect(plan.extra).toBe(153000); // 18% of 850,000
      expect(plan.total).toBe(1003000); // 850,000 + 153,000
      expect(plan.payments).toBe(26);
      expect(plan.perPayment).toBe(38600); // 25 payments of 38,600
      expect(plan.finalPayment).toBe(38000); // 1 final payment of 38,000
      expect(plan.hasDifferentFinalPayment).toBe(true);

      // Reconciled total check
      const scheduleSum = 25 * 38600 + 38000;
      expect(scheduleSum).toBe(1003000);
      expect(scheduleSum).toBe(plan.total);
    });
  });

  describe("Requirement 5: AdminDialog Focus Behavior During Typing", () => {
    function ControlledFormDialog() {
      const [valA, setValA] = React.useState("");
      const [valB, setValB] = React.useState("");

      return (
        <AdminDialog isOpen={true} onClose={() => {}} title="Test Form" description="Type without losing focus">
          <div>
            <label htmlFor="input-a">Input A</label>
            <input
              id="input-a"
              type="text"
              value={valA}
              onChange={(e) => setValA(e.target.value)}
            />
            <label htmlFor="input-b">Input B</label>
            <input
              id="input-b"
              type="text"
              value={valB}
              onChange={(e) => setValB(e.target.value)}
            />
          </div>
        </AdminDialog>
      );
    }

    it("maintains focus on active input element while typing across controlled fields", async () => {
      render(<ControlledFormDialog />);

      const inputA = container.querySelector("#input-a") as HTMLInputElement;
      const inputB = container.querySelector("#input-b") as HTMLInputElement;
      const closeBtn = container.querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement;

      expect(inputA).not.toBeNull();
      expect(inputB).not.toBeNull();

      // Focus inputA
      inputA.focus();
      expect(document.activeElement).toBe(inputA);

      // Simulate typing 'Felicity Solar' character by character
      const textA = "Felicity Solar";
      for (const char of textA) {
        act(() => {
          inputA.value += char;
          inputA.dispatchEvent(new Event("input", { bubbles: true }));
          inputA.dispatchEvent(new Event("change", { bubbles: true }));
        });
        // Crucial test: Focus must NOT jump back to closeBtn during typing!
        expect(document.activeElement).toBe(inputA);
        expect(document.activeElement).not.toBe(closeBtn);
      }

      // Move to inputB
      inputB.focus();
      expect(document.activeElement).toBe(inputB);

      // Simulate typing '850000'
      const textB = "850000";
      for (const char of textB) {
        act(() => {
          inputB.value += char;
          inputB.dispatchEvent(new Event("input", { bubbles: true }));
          inputB.dispatchEvent(new Event("change", { bubbles: true }));
        });
        expect(document.activeElement).toBe(inputB);
        expect(document.activeElement).not.toBe(closeBtn);
      }
    });
  });

  describe("Requirement 6 & 7: Product Deletion Pending Protection & Image Workflow", () => {
    const mockProduct = {
      id: "prod-101",
      name: "Solar Inverter 3.5kVA",
      category: "solar",
      brand: "Felicity",
      cash_price: 850000,
      description: "Heavy duty pure sine wave",
      images: ["/images/products/inverter.jpg"],
      specs: { Capacity: "3.5kVA", Voltage: "24V" },
      in_stock: true,
      featured: false,
      is_published: true,
    };

    it("requires confirmation and prevents duplicate delete mutations while request is pending", async () => {
      vi.spyOn(AdminFunctions, "listAdminProductsFn").mockResolvedValue([mockProduct] as any);
      let resolveDelete: (val: any) => void = () => {};
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      const deleteMock = vi.spyOn(AdminFunctions, "deleteProductFn").mockReturnValue(deletePromise as any);

      render(<AdminProducts />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(container.textContent).toContain("Solar Inverter 3.5kVA");

      // Find Delete button in table
      const deleteBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Delete"
      );
      expect(deleteBtn).toBeDefined();

      // Click Delete: opens accessible confirmation dialog
      act(() => {
        deleteBtn?.click();
      });

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain("Confirm Product Deletion");
      expect(dialog?.textContent).toContain("Solar Inverter 3.5kVA");

      // Click 'Permanently Delete'
      const confirmDeleteBtn = Array.from(dialog?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Permanently Delete"
      );
      expect(confirmDeleteBtn).toBeDefined();

      act(() => {
        confirmDeleteBtn?.click();
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith({ data: { id: "prod-101" } });

      // While pending: confirm button shows 'Deleting...' and is disabled
      expect(confirmDeleteBtn?.textContent).toContain("Deleting...");
      expect(confirmDeleteBtn?.hasAttribute("disabled")).toBe(true);

      // Attempt repeated click while pending: must NOT call deleteProductFn again
      act(() => {
        confirmDeleteBtn?.click();
      });
      expect(deleteMock).toHaveBeenCalledTimes(1);

      // Resolve deletion
      await act(async () => {
        resolveDelete({ success: true });
      });
    });
  });

  describe("Targeted Follow-up Verification: 9 Verified Defects", () => {
    const mockProduct = {
      id: "prod-101",
      name: "Solar Inverter 3.5kVA",
      category: "solar",
      brand: "Felicity",
      cash_price: 850000,
      description: "Heavy duty pure sine wave",
      images: ["/images/products/inverter.jpg"],
      specs: { Capacity: "3.5kVA", Voltage: "24V" },
      in_stock: true,
      featured: false,
      is_published: true,
    };

    it("Defect 1: prevents mixing staff notes between two applications during deferred async operations", async () => {
      const appA = {
        id: "app-A",
        reference: "SIB-20261018-0001",
        full_name: "Customer Alpha",
        phone: "08011111111",
        status: "New",
        category: "solar",
        product_name: "Solar Inverter",
        price: 500000,
        deposit: 0,
        charges: 0,
        duration: 6,
        frequency: "monthly",
        payment_count: 6,
        payment_amount: 98334,
        final_payment_amount: 98330,
        total_amount: 590000,
        notes: "Initial Alpha Note",
        created_at: new Date().toISOString(),
      };
      const appB = {
        id: "app-B",
        reference: "SIB-20261018-0002",
        full_name: "Customer Beta",
        phone: "08022222222",
        status: "New",
        category: "ev",
        product_name: "Electric Motorcycle",
        price: 800000,
        deposit: 0,
        charges: 0,
        duration: 6,
        frequency: "monthly",
        payment_count: 6,
        payment_amount: 157334,
        final_payment_amount: 157330,
        total_amount: 944000,
        notes: "Initial Beta Note",
        created_at: new Date().toISOString(),
      };

      vi.spyOn(AdminFunctions, "listAdminApplicationsFn").mockResolvedValue([appA, appB] as any);

      let resolveNotesA: (val: any) => void = () => {};
      const notesPromiseA = new Promise((resolve) => {
        resolveNotesA = resolve;
      });

      const updateNotesMock = vi.spyOn(AdminFunctions, "updateApplicationNotesFn").mockImplementation((args: any) => {
        if (args.data.id === "app-A") {
          return notesPromiseA as any;
        }
        return Promise.resolve({ success: true, notes: args.data.notes }) as any;
      });

      render(<AdminApplications />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // 1. Inspect Customer Alpha
      const inspectButtons = Array.from(container.querySelectorAll("button")).filter(
        (b) => b.textContent?.trim() === "Inspect"
      );
      expect(inspectButtons.length).toBe(2);
      act(() => {
        inspectButtons[0]?.click();
      });

      expect(container.textContent).toContain("Customer Alpha");

      // Edit Customer Alpha's notes
      const textarea = container.querySelector("#inspector-staff-notes") as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      act(() => {
        fireEvent.change(textarea, { target: { value: "Modified Alpha Notes" } });
      });

      // Click 'Save Notes' for Alpha (initiates pending promise)
      const saveBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Save Notes"
      );
      expect(saveBtn).toBeDefined();
      act(() => {
        saveBtn?.click();
      });

      expect(updateNotesMock).toHaveBeenCalledWith({
        data: { id: "app-A", notes: "Modified Alpha Notes" },
      });

      // 2. While Alpha save is pending, close Alpha inspector and switch to Customer Beta!
      const closeDialogBtn = container.querySelector('button[aria-label="Close dialog"]') as HTMLButtonElement;
      act(() => {
        closeDialogBtn?.click();
      });

      // Open Customer Beta
      const rows = Array.from(container.querySelectorAll("tbody tr"));
      const inspectBtnB = rows[1]?.querySelector("button");
      expect(inspectBtnB).toBeDefined();
      act(() => {
        inspectBtnB?.click();
      });

      expect(container.textContent).toContain("Customer Beta");

      // Customer Beta's notes are untouched
      const textareaB = container.querySelector("#inspector-staff-notes") as HTMLTextAreaElement;
      expect(textareaB.value).toBe("Initial Beta Note");
      act(() => {
        fireEvent.change(textareaB, { target: { value: "Draft Beta Notes In Progress" } });
      });
      expect(textareaB.value).toBe("Draft Beta Notes In Progress");

      // 3. Now resolve Customer Alpha's notes save
      await act(async () => {
        resolveNotesA({ success: true, notes: "Modified Alpha Notes" });
      });

      // Customer Beta's inspector and draft notes must NOT be overwritten!
      expect(container.textContent).toContain("Customer Beta");
      const textareaAfter = container.querySelector("#inspector-staff-notes") as HTMLTextAreaElement;
      expect(textareaAfter.value).toBe("Draft Beta Notes In Progress");
      // Must not show Alpha's success banner on Beta's view
      expect(container.textContent).not.toContain("Staff notes saved successfully.");
    });

    it("Defect 2 & 3: calculatePlan rejects negative prices and deposit >= price without crashing", () => {
      // Rejects negative prices
      expect(() =>
        calculatePlan({
          price: -100000,
          months: 6,
          frequency: "monthly",
        })
      ).toThrow("Invalid price");

      // Rejects deposit >= price
      expect(() =>
        calculatePlan({
          price: 500000,
          deposit: 500000,
          months: 6,
          frequency: "monthly",
        })
      ).toThrow("cannot exceed or equal cash price");

      expect(() =>
        calculatePlan({
          price: 500000,
          deposit: 600000,
          months: 6,
          frequency: "monthly",
        })
      ).toThrow("cannot exceed or equal cash price");
    });

    it("Defect 2 & 3: ApplicationModal safely catches deposit >= price and negative inputs without crashing", () => {
      const qClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={qClient}>
          <ApplicationModal
            isOpen={true}
            onClose={() => {}}
            initialData={{
              productId: "prod-invalid",
              productName: "Heavy Duty Inverter",
              category: "solar",
              price: 500000,
              deposit: 600000,
              duration: 6,
              frequency: "monthly",
            }}
          />
        </QueryClientProvider>
      );

      // Dialog is open and didn't crash
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
      // Displays inline error
      expect(container.textContent).toContain(
        "Upfront deposit must be non-negative and less than the total equipment cash price"
      );
    });

    it("Defect 5: AdminProducts image editor uses responsive stacking and min-w-0 for 320px viewport", async () => {
      vi.spyOn(AdminFunctions, "listAdminProductsFn").mockResolvedValue([mockProduct] as any);
      render(<AdminProducts />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Click Edit on mockProduct
      const editBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Edit"
      );
      expect(editBtn).toBeDefined();
      act(() => {
        editBtn?.click();
      });

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();

      // Find the image URL input and its add button container
      const imgInput = dialog?.querySelector('input[placeholder*="Image path"]') as HTMLInputElement;
      expect(imgInput).not.toBeNull();
      // Check input min-w-0 class
      expect(imgInput.className).toContain("min-w-0");

      // Check row container responsive classes (flex flex-col sm:flex-row)
      const rowContainer = imgInput.parentElement;
      expect(rowContainer?.className).toContain("flex-col");
      expect(rowContainer?.className).toContain("sm:flex-row");
    });

    it("Defect 6: Delete errors are displayed inside the delete confirmation dialog with retry option", async () => {
      vi.spyOn(AdminFunctions, "listAdminProductsFn").mockResolvedValue([mockProduct] as any);
      vi.spyOn(AdminFunctions, "deleteProductFn").mockRejectedValue(new Error("Turso SQLite locked"));

      render(<AdminProducts />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      const deleteBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Delete"
      );
      act(() => {
        deleteBtn?.click();
      });

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();

      const confirmDeleteBtn = Array.from(dialog?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Permanently Delete"
      );
      act(() => {
        confirmDeleteBtn?.click();
      });

      // Await rejection
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Dialog must remain open!
      const dialogStillOpen = container.querySelector('[role="dialog"]');
      expect(dialogStillOpen).not.toBeNull();
      // Error message rendered inside dialog
      expect(dialogStillOpen?.textContent).toContain("Turso SQLite locked");
      // Shows Permanently Delete button again ready for retry
      expect(dialogStillOpen?.textContent).toContain("Permanently Delete");
      // Product remains in table
      expect(container.textContent).toContain("Solar Inverter 3.5kVA");
    });

    it("Defect 7: getCurrentAdmin throws on 503 or network failure instead of returning null", async () => {
      vi.mocked(AuthClient.authClient.getSession).mockResolvedValue({
        error: { message: "503 Service Unavailable: Turso primary connection failure" },
      } as any);

      await expect(getCurrentAdmin()).rejects.toThrow(
        "503 Service Unavailable: Turso primary connection failure"
      );

      // When unauthenticated with no error, returns null
      vi.mocked(AuthClient.authClient.getSession).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await getCurrentAdmin();
      expect(result).toBeNull();
    });

    it("Defect 9: Status confirmation dialog auto-focuses Cancel, handles Escape, and restores focus", async () => {
      const mockApp = {
        id: "app-test-a11y",
        reference: "SIB-20261018-7777",
        full_name: "Fatima Garba",
        phone: "08039998877",
        status: "New",
        category: "gadgets",
        product_name: "iPhone 15 Pro",
        price: 1200000,
        deposit: 0,
        charges: 0,
        duration: 6,
        frequency: "monthly",
        payment_count: 6,
        payment_amount: 236000,
        final_payment_amount: 236000,
        total_amount: 1416000,
        notes: "KYC in review",
        created_at: new Date().toISOString(),
      };

      vi.spyOn(AdminFunctions, "listAdminApplicationsFn").mockResolvedValue([mockApp] as any);

      render(<AdminApplications />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      const inspectBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Inspect"
      );
      act(() => {
        inspectBtn?.click();
      });

      // Wait for modal initial focus timer (40ms) to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 60));
      });

      const approveBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Approve Application"
      );
      expect(approveBtn).toBeDefined();

      // Focus the approve button
      approveBtn?.focus();
      expect(document.activeElement).toBe(approveBtn);

      // Open confirmation panel
      act(() => {
        approveBtn?.click();
      });

      // Wait for autofocus on cancel button
      await act(async () => {
        await new Promise((r) => setTimeout(r, 70));
      });

      const confirmPanel = container.querySelector('[role="alertdialog"]');
      expect(confirmPanel).not.toBeNull();

      const cancelBtn = Array.from(confirmPanel?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Cancel"
      );
      expect(cancelBtn).toBeDefined();
      expect(document.activeElement).toBe(cancelBtn);

      // Press Escape on cancel button to cancel status change
      act(() => {
        fireEvent.keyDown(cancelBtn!, { key: "Escape" });
      });

      // Wait for focus restoration timeout to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 30));
      });

      // Confirmation panel closed
      expect(container.querySelector('[role="alertdialog"]')).toBeNull();
      // Focus restored to the approve button in the DOM
      const currentApproveBtn = container.querySelector('button[data-status-action="Approved"]');
      expect(document.activeElement).toBe(currentApproveBtn);
    });
  });
});

