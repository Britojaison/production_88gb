"use client";

import { useState, type ReactNode } from "react";

export function ShootsResponsiveLayout({
  shootsCount,
  pendingCount,
  shootsContent,
  railContent,
}: {
  shootsCount: number;
  pendingCount: number;
  shootsContent: ReactNode;
  railContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"shoots" | "requests">("shoots");

  return (
    <div className="shoots-responsive-wrapper">
      {/* Mobile Tab Control (Visible only on screens < 1024px) */}
      <div className="mobile-shoots-tabs lg:hidden" role="tablist" aria-label="Shoots view switcher">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "shoots"}
          onClick={() => setActiveTab("shoots")}
          className={`mobile-shoots-tab ${activeTab === "shoots" ? "active" : ""}`}
        >
          <span>Shoots</span>
          <span className="mobile-tab-count">{shootsCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "requests"}
          onClick={() => setActiveTab("requests")}
          className={`mobile-shoots-tab ${activeTab === "requests" ? "active" : ""}`}
        >
          <span>Request Status</span>
          {pendingCount > 0 ? (
            <span className="mobile-tab-count badge-pending">{pendingCount}</span>
          ) : null}
        </button>
      </div>

      {/* Main Layout: Tab-switched on mobile, side-by-side on desktop */}
      <div className="shoots-layout">
        <div className={`shoots-scroll-pane ${activeTab === "shoots" ? "block" : "hidden lg:block"}`}>
          {shootsContent}
        </div>

        <div className={`shoots-rail-pane ${activeTab === "requests" ? "block" : "hidden lg:block"}`}>
          {railContent}
        </div>
      </div>
    </div>
  );
}

