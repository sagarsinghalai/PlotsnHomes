"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
};

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  id?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  name,
  required = false,
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 280 && rect.top > 280) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full text-left" style={{ zIndex: isOpen ? 9999 : "auto" }}>
      {/* Hidden input for HTML form submission compatibility */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Trigger Button - Clean White Box with Black Text */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs transition hover:bg-slate-50 focus:border-slate-400 outline-none disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-slate-400 ring-2 ring-slate-200",
          className
        )}
      >
        <span className={cn("truncate font-bold text-slate-900", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu Panel - Smart Positioned White Box */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 z-50 w-full min-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95",
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {/* Sticky Search Input Bar */}
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors hover:bg-slate-100 text-slate-900",
                      isSelected && "bg-amber-50 font-bold text-slate-900 border border-amber-200",
                      opt.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate text-slate-900 font-bold">{opt.label}</p>
                      {opt.sublabel && <p className="truncate text-[10px] text-slate-500 font-medium">{opt.sublabel}</p>}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-amber-700 stroke-[2.5]" />}
                  </button>
                );
              })
            ) : (
              <p className="py-4 text-center text-xs text-slate-400 italic">No matching options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
