import React from "react";

export default function GenericFeaturePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-12 lg:py-16">
      
      {/* Editorial Header Section */}
      <header className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A89C8D]">
            Asset Collection
          </p>
          <h1 className="font-serif text-3xl font-normal tracking-wide text-[#29231D] sm:text-4xl">
            Properties Portfolio
          </h1>
        </div>
        
        {/* Call to Action Anchor */}
        <div className="shrink-0">
          <button className="rounded-md bg-[#0D0C0A] px-5 py-2.5 text-xs font-medium tracking-wide text-[#D8B66A] transition-all duration-300 hover:bg-[#1A1815] active:scale-[0.98]">
            + Add New Property
          </button>
        </div>
      </header>

      {/* Primary Workspace Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Main Content Area (e.g., Table or Cards List) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#EDE7DC] bg-white/40 p-8 backdrop-blur-sm">
            <h3 className="font-serif text-lg text-[#29231D] mb-4">Active Listings</h3>
            <div className="h-64 flex items-center justify-center border border-dashed border-[#E3DCD0] rounded-lg text-xs text-[#8F8578] tracking-wide">
              Data view injection wrapper context
            </div>
          </div>
        </div>

        {/* Sidebar contextual insight column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#EDE7DC] bg-[#12110F]/2 p-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A89C8D] mb-3">
              Portfolio Value
            </h4>
            <p className="font-serif text-3xl font-light text-[#29231D]">$42,850,000</p>
            <div className="mt-4 border-t border-[#EDE7DC] pt-4 text-[11px] leading-relaxed text-[#7C7265]">
              Metrics automatically computed across active contracts and brokerages under Rose Key Realty Co.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}