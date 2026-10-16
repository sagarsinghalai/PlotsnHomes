"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2, Pencil, Check, X } from "lucide-react";

export function ListingTypesManager() {
  const [listingTypes, setListingTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInput, setNewInput] = useState("");

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    fetchOptions();
  }, []);

  async function fetchOptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success && data.listingTypes) {
        setListingTypes(data.listingTypes);
      }
    } catch (err) {
      console.error("Failed to fetch listing types:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddOption() {
    if (!newInput.trim()) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup: "listing-types", optionValue: newInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setListingTypes(data.options);
        setNewInput("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add option");
    }
  }

  async function handleSaveEdit(index: number) {
    if (!editingValue.trim()) return;
    const updated = [...listingTypes];
    updated[index] = editingValue.trim();

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup: "listing-types", optionsList: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setListingTypes(updated);
        setEditingIndex(null);
        setEditingValue("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to edit option");
    }
  }

  async function handleRemoveOption(itemToRemove: string) {
    const updated = listingTypes.filter((x) => x !== itemToRemove);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup: "listing-types", optionsList: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setListingTypes(updated);
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove option");
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Tag className="h-7 w-7 text-amber-600" />
          Listing Types
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage and edit Listing Type tags (e.g. Sales, Rentals, Lease) synced across all property forms.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
          <input
            type="text"
            placeholder="e.g. Sales, Rentals, Lease, PG / Hostel..."
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOption();
              }
            }}
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddOption}
            className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Listing Type</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">Loading options...</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listingTypes.map((item, idx) => {
              const isEditing = editingIndex === idx;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 shadow-2xs group hover:border-amber-400 transition"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit(idx);
                          } else if (e.key === "Escape") {
                            setEditingIndex(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 rounded-lg border border-amber-500 bg-white px-2.5 py-1 text-sm font-bold text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Save Tag"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="cursor-pointer hover:text-amber-600 transition flex items-center gap-1.5"
                        onClick={() => {
                          setEditingIndex(idx);
                          setEditingValue(item);
                        }}
                        title="Click to edit tag"
                      >
                        {item}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingValue(item);
                          }}
                          className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg transition hover:bg-amber-50"
                          title="Edit Tag"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(item)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition hover:bg-red-50"
                          title="Remove Option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
