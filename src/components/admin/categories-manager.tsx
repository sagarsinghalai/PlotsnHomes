"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Building,
  Home,
  Crown,
  LandPlot,
  Store,
  Layers,
  Layout,
  Plus,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  FolderTree,
  Tag as TagIcon,
  Sparkles,
  Search,
  Shield,
  CreditCard,
  Briefcase,
  Key,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

export type PropertyCategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  subcategories: string; // JSON array
  tags: string; // JSON array
  createdAt?: string;
  updatedAt?: string;
};

const ICON_OPTIONS = [
  { key: "building-2", label: "Building Highrise", icon: Building2 },
  { key: "home", label: "Home / Villa", icon: Home },
  { key: "crown", label: "Crown / Luxury", icon: Crown },
  { key: "building", label: "Townhouse / Row", icon: Building },
  { key: "land-plot", label: "Land / Plot", icon: LandPlot },
  { key: "store", label: "Store / Commercial", icon: Store },
  { key: "layers", label: "Layers / Duplex", icon: Layers },
  { key: "layout", label: "Layout / Full Floor", icon: Layout },
  { key: "shield", label: "Shield / Secured", icon: Shield },
  { key: "credit-card", label: "Financial / Card", icon: CreditCard },
  { key: "briefcase", label: "Business / Office", icon: Briefcase },
  { key: "key", label: "Key / Rental", icon: Key },
];

function getCategoryIcon(iconKey: string) {
  const found = ICON_OPTIONS.find((i) => i.key === iconKey);
  const IconComponent = found ? found.icon : Building2;
  return IconComponent;
}

const CARD_THEMES = [
  {
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    pill: "bg-indigo-600 border-indigo-700 text-white"
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    pill: "bg-emerald-700 border-emerald-800 text-white"
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    pill: "bg-amber-700 border-amber-800 text-white"
  },
  {
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
    pill: "bg-purple-700 border-purple-800 text-white"
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
    pill: "bg-rose-700 border-rose-800 text-white"
  },
  {
    bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300",
    pill: "bg-teal-700 border-teal-800 text-white"
  },
];

export function CategoriesManager() {
  const router = useRouter();
  const { hasAddPermission, hasEditPermission, hasDeletePermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/categories");
  const canEdit = hasEditPermission("/admin/categories");
  const canDelete = hasDeletePermission("/admin/categories");
  const [categories, setCategories] = useState<PropertyCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PropertyCategoryItem | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("building-2");
  const [description, setDescription] = useState("");
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategoriesList, setSubcategoriesList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagsList, setTagsList] = useState<string[]>([]);

  // Quick add per category card state
  const [cardSubcategoryInputs, setCardSubcategoryInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"categories" | "listing-types" | "property-types" | "statuses">("categories");
  const [listingTypesList, setListingTypesList] = useState<string[]>(["Sales", "Rentals", "Lease", "PG / Hostel"]);
  const [typesList, setTypesList] = useState<string[]>(["RESIDENTIAL", "COMMERCIAL", "LAND", "RENTAL", "INDUSTRIAL", "HOSPITALITY"]);
  const [statusesList, setStatusesList] = useState<string[]>(["ACTIVE", "DRAFT", "PENDING", "SOLD", "RENTED", "UNDER_OFFER"]);

  const [newListingTypeInput, setNewListingTypeInput] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");
  const [newStatusInput, setNewStatusInput] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        if (data.listingTypes) setListingTypesList(data.listingTypes);
        if (data.types) setTypesList(data.types);
        if (data.statuses) setStatusesList(data.statuses);
      } else {
        setError(data.error || "Failed to load categories");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSystemOption(targetGroup: "listing-types" | "property-types" | "statuses", value: string) {
    if (!value.trim()) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup, optionValue: value.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (targetGroup === "listing-types") {
          setListingTypesList(data.options);
          setNewListingTypeInput("");
        } else if (targetGroup === "property-types") {
          setTypesList(data.options);
          setNewTypeInput("");
        } else if (targetGroup === "statuses") {
          setStatusesList(data.options);
          setNewStatusInput("");
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to add option");
    }
  }

  async function handleRemoveSystemOption(targetGroup: "listing-types" | "property-types" | "statuses", itemToRemove: string) {
    let updated: string[] = [];
    if (targetGroup === "listing-types") updated = listingTypesList.filter((x) => x !== itemToRemove);
    else if (targetGroup === "property-types") updated = typesList.filter((x) => x !== itemToRemove);
    else if (targetGroup === "statuses") updated = statusesList.filter((x) => x !== itemToRemove);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup, optionsList: updated }),
      });
      const data = await res.json();
      if (data.success) {
        if (targetGroup === "listing-types") setListingTypesList(updated);
        else if (targetGroup === "property-types") setTypesList(updated);
        else if (targetGroup === "statuses") setStatusesList(updated);
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove option");
    }
  }

  function handleOpenCreateModal() {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setIcon("building-2");
    setDescription("");
    setSubcategoryInput("");
    setSubcategoriesList(["Studio", "1 BHK", "2 BHK", "Luxury Suite"]);
    setTagInput("");
    setTagsList(["Popular", "Verified"]);
    setShowModal(true);
  }

  function handleOpenEditModal(cat: PropertyCategoryItem) {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || "building-2");
    setDescription(cat.description || "");
    setSubcategoryInput("");
    try {
      setSubcategoriesList(JSON.parse(cat.subcategories || "[]"));
    } catch {
      setSubcategoriesList([]);
    }
    try {
      setTagsList(JSON.parse(cat.tags || "[]"));
    } catch {
      setTagsList([]);
    }
    setShowModal(true);
  }

  function parseSubcategories(jsonStr: string): string[] {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function parseTags(jsonStr: string): string[] {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function handleAddSubcategoryModal() {
    if (!subcategoryInput.trim()) return;
    if (!subcategoriesList.includes(subcategoryInput.trim())) {
      setSubcategoriesList([...subcategoriesList, subcategoryInput.trim()]);
    }
    setSubcategoryInput("");
  }

  function handleRemoveSubcategoryModal(item: string) {
    setSubcategoriesList(subcategoriesList.filter((s) => s !== item));
  }

  function handleAddTagModal() {
    if (!tagInput.trim()) return;
    if (!tagsList.includes(tagInput.trim())) {
      setTagsList([...tagsList, tagInput.trim()]);
    }
    setTagInput("");
  }

  function handleRemoveTagModal(t: string) {
    setTagsList(tagsList.filter((x) => x !== t));
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name,
            slug,
            icon,
            description,
            subcategories: subcategoriesList,
            tags: tagsList,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchCategories();
        } else {
          alert(data.error || "Failed to update category");
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            slug,
            icon,
            description,
            subcategories: subcategoriesList,
            tags: tagsList,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchCategories();
        } else {
          alert(data.error || "Failed to create category");
        }
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  }

  async function handleDeleteCategory(id: string, catName: string) {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error || "Failed to delete category");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  }

  async function handleQuickAddSubcategory(cat: PropertyCategoryItem) {
    const text = cardSubcategoryInputs[cat.id]?.trim();
    if (!text) return;

    const existingSubs = parseSubcategories(cat.subcategories);
    if (existingSubs.includes(text)) {
      setCardSubcategoryInputs((prev) => ({ ...prev, [cat.id]: "" }));
      return;
    }

    const updatedSubs = [...existingSubs, text];
    setSavingId(cat.id);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          subcategories: updatedSubs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCardSubcategoryInputs((prev) => ({ ...prev, [cat.id]: "" }));
        fetchCategories();
      } else {
        alert(data.error || "Failed to add subcategory");
      }
    } catch (err: any) {
      alert(err.message || "Error adding subcategory");
    } finally {
      setSavingId(null);
    }
  }

  async function handleQuickRemoveSubcategory(cat: PropertyCategoryItem, sub: string) {
    const existingSubs = parseSubcategories(cat.subcategories);
    const updatedSubs = existingSubs.filter((s) => s !== sub);

    setSavingId(cat.id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          subcategories: updatedSubs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error removing subcategory");
    } finally {
      setSavingId(null);
    }
  }

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    const subs = parseSubcategories(c.subcategories).join(" ").toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || subs.includes(q);
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderTree className="h-7 w-7 text-amber-600" />
            Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage product & property categories, subcategories, and tags for filters across the platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 outline-none shadow-sm"
            />
          </div>

          {canAdd && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>New Category</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT 1: CATEGORIES */}
      {activeTab === "categories" && (
        <>
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-56 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-100" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-1/4 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-white p-4 text-xs text-red-700 font-semibold shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {filteredCategories.map((cat, idx) => {
                const IconComp = getCategoryIcon(cat.icon);
                const subs = parseSubcategories(cat.subcategories);
                const theme = CARD_THEMES[idx % CARD_THEMES.length];

                return (
                  <div
                    key={cat.id}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-400 transition-all duration-200 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className={`rounded-xl p-3 border flex items-center justify-center ${theme.bg}`}>
                            <IconComp className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                              {cat.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{subs.length} options</span>
                              <span>•</span>
                              <span className="font-mono text-[11px] font-bold text-slate-400">
                                {cat.slug}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(cat)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="Edit Category"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {cat.description}
                        </p>
                      )}

                      {/* Subcategories list */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Dropdown Subcategories:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {subs.map((sub, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs group/pill"
                            >
                              <span>{sub}</span>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickRemoveSubcategory(cat, sub)}
                                  className="text-slate-400 hover:text-red-600 transition"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {canAdd && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add subcategory option..."
                          value={cardSubcategoryInputs[cat.id] || ""}
                          onChange={(e) =>
                            setCardSubcategoryInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleQuickAddSubcategory(cat);
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          disabled={savingId === cat.id}
                          onClick={() => handleQuickAddSubcategory(cat)}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}



      {/* New / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouses & Industrial"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">URL Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. warehouse-industrial"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Select Icon</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of properties under this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                />
              </div>

              {/* Subcategories Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold uppercase text-slate-500 block">Subcategories</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add subcategory (e.g. Studio, Duplex, Warehouse)..."
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubcategoryModal();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategoryModal}
                    className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {subcategoriesList.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-300 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategoryModal(s)}
                        className="rounded-full hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold uppercase text-slate-500 block">Tags</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. Freehold, Gated, Corner)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTagModal();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTagModal}
                    className="rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tagsList.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-sm"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTagModal(t)}
                        className="rounded-full hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
