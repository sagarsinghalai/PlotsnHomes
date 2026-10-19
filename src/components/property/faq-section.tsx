"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is Fractional Real Estate Ownership?",
    answer: "Fractional ownership is a method where multiple investors share ownership of a high-value property. Each investor owns a specific share (e.g. from ₹40,000 minimum) and receives a proportional share of the monthly rental income and capital appreciation, without the hassle of property management."
  },
  {
    question: "How do I earn monthly rental income?",
    answer: "The properties are already leased to high-quality tenants. We collect the rent monthly and automatically distribute the net rent to your PlotsnHomes wallet proportional to the number of shares you hold. You can withdraw this to your bank account anytime."
  },
  {
    question: "What is the minimum investment amount?",
    answer: "The minimum investment amount varies by property but generally starts at ₹40,000. This makes premium residential and commercial assets accessible to retail investors who want to diversify their portfolios."
  },
  {
    question: "How and when can I exit my investment?",
    answer: "Unlike traditional real estate, PlotsnHomes offers a built-in secondary marketplace. You can list your property shares for sale anytime. Once matched with another buyer on our platform, the funds are instantly credited to your wallet. There is no lock-in period."
  },
  {
    question: "Are these investments regulated and safe?",
    answer: "Yes. All properties are held by a dedicated Special Purpose Vehicle (SPV) structure registered under legal guidelines. The properties are managed by professional property managers, fully insured, and undergo rigorous legal and title verification before listing."
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="relative bg-slate-50 py-20 border-t border-slate-200/50 overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold text-brand-hover tracking-widest uppercase mb-2">COMMON QUESTIONS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Everything you need to know about our fractional real estate marketplace, yields, exits, and security.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 shadow-sm hover:border-brand/30 hover:shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="flex items-center justify-between w-full px-6 py-5 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5 pr-4">
                    <HelpCircle className={`h-5 w-5 shrink-0 transition-colors duration-300 ${isOpen ? "text-brand" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="font-bold text-slate-800 text-sm sm:text-base transition-colors group-hover:text-brand-hover">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-brand" : "group-hover:text-slate-600"
                    }`}
                  />
                </button>

                <div
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "200px" : "0px",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/30 pl-[46px]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
