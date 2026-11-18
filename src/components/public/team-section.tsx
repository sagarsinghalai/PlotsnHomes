"use client";

import { useState } from "react";
import { Phone, ArrowRight } from "lucide-react";
import type { TeamMemberItem } from "@/lib/site-settings";

const PORTRAITS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
];

const BLURBS: Record<string, string> = {
  "Sarah Mitchell": "Walks first-time buyers through shortlists, site visits, and the paperwork that usually gets skipped.",
  "Maria Lopez": "Matches renters and investors with homes that fit the budget, not just the brochure.",
  "David Kim": "Knows the resale and plot market street by street, and says so when a price does not make sense.",
  "James Chen": "Stays on the file from the first call through registration, so you are not passed between desks.",
};

const FALLBACK: TeamMemberItem[] = [
  { id: "sarah", name: "Sarah Mitchell", designation: "Buyer advisor", countryCode: "+91", phone: "9820134567" },
  { id: "maria", name: "Maria Lopez", designation: "Rentals lead", countryCode: "+91", phone: "9678045123" },
  { id: "david", name: "David Kim", designation: "Plots specialist", countryCode: "+91", phone: "9845671234" },
  { id: "james", name: "James Chen", designation: "Closing partner", countryCode: "+91", phone: "9730022891" },
];

function portrait(member: TeamMemberItem, index: number) {
  if (member.image && member.image.trim()) return member.image;
  return PORTRAITS[index % PORTRAITS.length];
}

function blurb(member: TeamMemberItem) {
  return BLURBS[member.name] || `${member.designation || "Advisor"} at PlotsnHomes. Ask for a shortlist that matches how you want to live.`;
}

function phoneLabel(member: TeamMemberItem) {
  const code = member.countryCode?.trim();
  const phone = member.phone?.trim();
  if (!phone) return "";
  return code ? `${code} ${phone}` : phone;
}

export function TeamSection({ members }: { members: TeamMemberItem[] }) {
  const people = (members.length > 0 ? members : FALLBACK).slice(0, 6);
  const [active, setActive] = useState(0);
  const person = people[active] ?? people[0];
  const dial = phoneLabel(person).replace(/\s/g, "");

  return (
    <section id="team" className="border-t border-slate-100 bg-white py-16 text-slate-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-950">
              Our agents
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium text-slate-950 sm:text-5xl">Meet our team</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Pick an advisor. You will see how they help, and you can call them directly.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="listbox" aria-label="Team members">
            {people.map((member, index) => {
              const selected = index === active;
              return (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setActive(index)}
                  className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    selected ? "border-[#B4F06B] ring-2 ring-[#B4F06B]" : "border-slate-200"
                  }`}
                >
                  <span className="relative block aspect-[3/4] overflow-hidden bg-slate-100">
                    <img
                      src={portrait(member, index)}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {selected && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#B4F06B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                        Selected
                      </span>
                    )}
                  </span>
                  <span className="block px-3 py-3">
                    <span className="block truncate text-sm font-semibold text-slate-950">{member.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{member.designation || "Advisor"}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={portrait(person, active)}
                alt={person.name}
                className="aspect-[4/3] h-auto w-full object-cover object-top"
              />
            </div>
            <p className="mt-4 font-display text-3xl leading-tight text-slate-950">{person.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{person.designation || "Real estate agent"}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{blurb(person)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {dial && (
                <a
                  href={`tel:${dial}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#B4F06B] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-95"
                >
                  <Phone className="h-4 w-4" />
                  {phoneLabel(person)}
                </a>
              )}
              <a
                href="#get-in-touch"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#B4F06B]"
              >
                Request a callback <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
