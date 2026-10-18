import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
} from "@/components/admin/AdminStateFeedback";

describe("Admin Hardening & Accessibility Verification", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const render = (ui: React.ReactElement) => {
    act(() => {
      root.render(ui);
    });
  };

  describe("AdminStateFeedback Components", () => {
    it("renders AdminLoadingState with polite status announcer", () => {
      render(<AdminLoadingState message="Fetching system records..." />);
      const statusEl = container.querySelector('[role="status"]');
      expect(statusEl).not.toBeNull();
      expect(statusEl?.getAttribute("aria-live")).toBe("polite");
      expect(statusEl?.textContent).toContain("Fetching system records...");
    });

    it("renders AdminErrorState with alert role and triggers onRetry", () => {
      const onRetryMock = vi.fn();
      render(
        <AdminErrorState
          title="Database timeout"
          message="Could not reach the server"
          onRetry={onRetryMock}
        />
      );

      const alertEl = container.querySelector('[role="alert"]');
      expect(alertEl).not.toBeNull();
      expect(alertEl?.textContent).toContain("Database timeout");
      expect(alertEl?.textContent).toContain("Could not reach the server");

      const retryBtn = container.querySelector("button");
      expect(retryBtn).not.toBeNull();
      expect(retryBtn?.textContent).toContain("Retry Loading");

      act(() => {
        retryBtn?.click();
      });
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it("renders AdminEmptyState with message and action button", () => {
      const onActionMock = vi.fn();
      render(
        <AdminEmptyState
          title="No records found"
          message="Try refining your search"
          actionLabel="Add New Entry"
          onAction={onActionMock}
        />
      );

      expect(container.textContent).toContain("No records found");
      expect(container.textContent).toContain("Try refining your search");

      const actionBtn = container.querySelector("button");
      expect(actionBtn).not.toBeNull();
      expect(actionBtn?.textContent).toContain("Add New Entry");

      act(() => {
        actionBtn?.click();
      });
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("AdminDialog Accessible Overlay", () => {
    it("renders when open and has accessible dialog semantics", () => {
      const onCloseMock = vi.fn();
      render(
        <AdminDialog
          isOpen={true}
          onClose={onCloseMock}
          title="Edit Configuration"
          description="Update company settings and operational policies"
        >
          <div>
            <label htmlFor="field-test">Test Input</label>
            <input id="field-test" type="text" defaultValue="Value" />
          </div>
        </AdminDialog>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
      expect(dialog?.getAttribute("aria-labelledby")).toBe("admin-dialog-title");
      expect(dialog?.getAttribute("aria-describedby")).toBe("admin-dialog-description");

      const title = container.querySelector("#admin-dialog-title");
      expect(title?.textContent).toBe("Edit Configuration");

      const desc = container.querySelector("#admin-dialog-description");
      expect(desc?.textContent).toBe("Update company settings and operational policies");
    });

    it("does not render when isOpen is false", () => {
      render(
        <AdminDialog isOpen={false} onClose={() => {}} title="Hidden Dialog">
          <div>Hidden Content</div>
        </AdminDialog>
      );

      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(container.textContent).toBe("");
    });

    it("dismisses on Escape key press", () => {
      const onCloseMock = vi.fn();
      render(
        <AdminDialog isOpen={true} onClose={onCloseMock} title="Escape Test">
          <div>Press escape to close</div>
        </AdminDialog>
      );

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        window.dispatchEvent(event);
      });

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("locks body scroll while open and restores it when unmounted", () => {
      expect(document.body.style.overflow).toBe("");

      render(
        <AdminDialog isOpen={true} onClose={() => {}} title="Scroll Lock Test">
          <div>Content</div>
        </AdminDialog>
      );

      expect(document.body.style.overflow).toBe("hidden");

      render(
        <AdminDialog isOpen={false} onClose={() => {}} title="Scroll Lock Test">
          <div>Content</div>
        </AdminDialog>
      );

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Async Filter Race-Condition Guard (requestIdRef)", () => {
    it("ignores out-of-order stale async filter responses", async () => {
      // Replicate the requestIdRef pattern used in AdminApplications, AdminMessages, AdminFaqs
      let requestIdCounter = 0;
      let activeResults: string[] = [];

      const triggerAsyncFilter = async (filterQuery: string, latencyMs: number) => {
        requestIdCounter += 1;
        const thisRequestId = requestIdCounter;

        await new Promise((r) => setTimeout(r, latencyMs));

        // Only update if this request matches the latest initiated request
        if (thisRequestId === requestIdCounter) {
          activeResults = [`Results for ${filterQuery}`];
        }
      };

      // User rapidly changes filter: query "A" (slow network 50ms) then "B" (fast network 10ms)
      const promiseA = triggerAsyncFilter("Filter A", 50);
      const promiseB = triggerAsyncFilter("Filter B", 10);

      await Promise.all([promiseA, promiseB]);

      // Even though Filter A resolved later than Filter B, activeResults must reflect Filter B!
      expect(activeResults).toEqual(["Results for Filter B"]);
    });
  });

  describe("AdminDialog Focus Containment", () => {
    it("traps focus between first and last focusable element", () => {
      render(
        <AdminDialog isOpen={true} onClose={() => {}} title="Trap Test">
          <div>
            <button id="first-btn" type="button">First</button>
            <input id="middle-input" type="text" defaultValue="Middle" />
            <button id="last-btn" type="button">Last</button>
          </div>
        </AdminDialog>
      );

      const closeBtn = container.querySelector('button[aria-label="Close dialog"]') as HTMLElement;
      const lastBtn = container.querySelector("#last-btn") as HTMLElement;

      expect(closeBtn).not.toBeNull();
      expect(lastBtn).not.toBeNull();

      // Close dialog button is first focusable; test Shift+Tab wraps to lastBtn
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      act(() => {
        const shiftTabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(shiftTabEvent);
      });

      // Shift+Tab from first should focus last
      expect(document.activeElement).toBe(lastBtn);

      // Tab from last should wrap to first
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(closeBtn);
    });
  });
});

