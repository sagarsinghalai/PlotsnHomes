"use client";

import React, { useState, useEffect, useRef } from "react";
import { Printer, Share2, Copy, Check, MessageSquare } from "lucide-react";

interface PropertyActionsProps {
  propertyTitle: string;
  propertyPrice: string;
  propertyAddress: string;
  propertyDescription?: string;
  coverImageUrl?: string;
  propertyType?: string;
  listingStatus?: string;
  bedsText?: string;
  bathsText?: string;
  areaText?: string;
}

export function PropertyActions({
  propertyTitle,
  propertyPrice,
  propertyAddress,
  propertyDescription,
  propertyType,
  listingStatus,
  bedsText,
  bathsText,
  areaText,
  coverImageUrl,
}: PropertyActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [popupError, setPopupError] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [apiMissingNotice, setApiMissingNotice] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrint = () => {
    window.print();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  };

  const buildShareMessage = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const lines: string[] = [];

    lines.push(`🏠 *${propertyTitle}*`);
    if (propertyType) lines.push(`📋 Type: ${propertyType}`);
    if (listingStatus) lines.push(`🔖 Status: ${listingStatus}`);
    lines.push(`📍 Location: ${propertyAddress}`);
    lines.push(`💰 Price: ${propertyPrice}`);

    const details: string[] = [];
    if (bedsText) details.push(`🛏 ${bedsText}`);
    if (bathsText) details.push(`🚿 ${bathsText}`);
    if (areaText) details.push(`📐 ${areaText}`);
    if (details.length > 0) lines.push(details.join("  ·  "));

    if (propertyDescription) {
      const shortDesc = propertyDescription.length > 200
        ? propertyDescription.slice(0, 200).trim() + "…"
        : propertyDescription;
      lines.push(`\n${shortDesc}`);
    }

    lines.push(`\n🔗 View full details: ${url}`);

    return { text: lines.join("\n"), url };
  };

  const handleShare = async () => {
    const { url } = buildShareMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `${propertyTitle} — ${propertyAddress} (${propertyPrice})`,
          url,
        });
      } catch {
        setDropdownOpen(!dropdownOpen);
      }
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleWhatsAppShare = async () => {
    setDropdownOpen(false);
    setApiMissingNotice(false);
    setSuccessMessage("");
    setPopupError(false);

    if (sharingLoading) return;
    setSharingLoading(true);

    try {
      const phoneInput = window.prompt(
        "Enter recipient's phone number with country code (e.g. +919876543210):"
      );
      if (!phoneInput) {
        setSharingLoading(false);
        return;
      }

      const normalizedPhone = phoneInput.replace(/\D/g, "");
      if (!normalizedPhone || normalizedPhone.length < 10) {
        alert("Invalid phone number format. Provide country code and digits.");
        setSharingLoading(false);
        return;
      }

      const { text } = buildShareMessage();

      const payload: any = {
        phone: normalizedPhone,
        text: text,
      };

      if (coverImageUrl) {
        payload.type = "image";
        payload.mediaUrl = coverImageUrl;
      } else {
        payload.type = "text";
      }

      const shareRes = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const shareData = await shareRes.json();
      if (!shareRes.ok) {
        throw new Error(shareData.error || "Failed to share via WhatsApp API");
      }

      setSuccessMessage("Sent successfully on WhatsApp.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setDropdownOpen(false);
  };

  return (
    <div className="flex flex-col items-end gap-2 mt-3" ref={dropdownRef}>
      <div className="flex items-center justify-end gap-2 relative">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>

        <div className="relative">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={handleWhatsAppShare}
                disabled={sharingLoading}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                {sharingLoading ? "Sending..." : "Share on WhatsApp"}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {popupError && (
        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 max-w-xs text-right leading-relaxed animate-fade-in">
          Popup blocked. Please allow popups for this site and try again.
        </p>
      )}

      {apiMissingNotice && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xs text-right leading-relaxed animate-fade-in">
          Image attachment requires WhatsApp Business API configuration.
        </p>
      )}

      {successMessage && (
        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-250 rounded-lg px-3 py-2 max-w-xs text-right leading-relaxed animate-fade-in">
          {successMessage}
        </p>
      )}
    </div>
  );
}
