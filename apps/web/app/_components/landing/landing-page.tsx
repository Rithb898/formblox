"use client";

import { FinalCta } from "./final-cta";
import { LandingFaq } from "./faq";
import { Hero } from "./hero";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { Pricing } from "./pricing";
import { ProductBento } from "./product-bento";
import { StatsBar } from "./stats-bar";
import { Testimonials } from "./testimonials";
import { WedgeShowcase } from "./wedge-showcase";

export function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Background Lighting Flares */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-18rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#E8854A] opacity-[0.12] blur-[160px]" />
        <div className="absolute bottom-[-22rem] left-[8vw] h-[36rem] w-[36rem] rounded-full bg-[#174c4c] opacity-[0.12] blur-[170px]" />
        <div className="absolute bottom-[10vh] right-[-18rem] h-[36rem] w-[36rem] rounded-full bg-[#E8854A] opacity-[0.06] blur-[170px]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      
      {/* Page Content */}
      <div className="relative z-10">
        <LandingNav />
        <Hero />
        <StatsBar />
        <ProductBento />
        <WedgeShowcase />
        <Pricing />
        <Testimonials />
        <LandingFaq />
        <FinalCta />
        <LandingFooter />
      </div>
    </main>
  );
}
