"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  ClipboardList,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutGrid,
  Loader2,
  Lock,
  MessageSquare,
  Monitor,
  MoveUp,
  GripVertical,
  MoveDown,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Trash2,
  Type,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomPage, NavItemLink, NavSettings, SectionBlock, SectionType, OVERRIDABLE_ROUTES } from "@/lib/webpage-editor-store";
import { SectionRenderer } from "@/components/admin/webpage-editor/section-renderer";

const FONT_FAMILIES = [
  { label: "Default (Inter)", value: "font-sans" },
  { label: "Impact / Arial Black", value: "'Impact', 'Arial Black', sans-serif" },
  { label: "Playfair Display (Serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Outfit (Modern Sans)", value: "'Outfit', sans-serif" },
  { label: "Roboto (Clean)", value: "'Roboto', sans-serif" },
  { label: "Monospace", value: "monospace" },
];

const WIDGET_TYPES: { type: SectionType; label: string; icon: any; desc: string }[] = [
  { type: "hero", label: "Hero Banner", icon: Layout, desc: "Full-width header with headline & CTA buttons" },
  { type: "text", label: "Rich Text / Article", icon: FileText, desc: "Formatted article body content & headings" },
  { type: "features", label: "Feature Cards Grid", icon: LayoutGrid, desc: "Grid of icon feature highlights" },
  { type: "properties", label: "Property Showcase", icon: Building2, desc: "Real estate listings grid with pricing" },
  { type: "cta", label: "Call-To-Action Banner", icon: Sparkles, desc: "High-converting action bar with gradient" },
  { type: "faq", label: "FAQ Accordion", icon: HelpCircle, desc: "Collapsible questions & answers list" },
  { type: "testimonials", label: "Client Reviews", icon: Star, desc: "Customer review cards & star ratings" },
  { type: "stats", label: "Metrics Counter Bar", icon: Layers, desc: "4-column key metrics counter bar" },
  { type: "gallery", label: "Media Gallery", icon: ImageIcon, desc: "Photo container & video player embed" },
  { type: "columns", label: "Columns (Row)", icon: LayoutGrid, desc: "A row split into 2–4 responsive columns" },
  { type: "form", label: "Form", icon: ClipboardList, desc: "Embed one of your built forms to collect leads" },
  { type: "rawHtml", label: "Custom Code", icon: FileCode, desc: "HTML + CSS + JS, run in a safe sandbox" },
];

export function WebpageEditorClient({
  initialPages,
  initialNav,
  forms = [],
}: {
  initialPages: CustomPage[];
  initialNav: NavSettings;
  forms?: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState<CustomPage[]>(initialPages);
  const [nav, setNav] = useState<NavSettings>(initialNav);

  const [activeTab, setActiveTab] = useState<"builder" | "pages" | "nav">("builder");
  const [activePageId, setActivePageId] = useState<string>(initialPages[0]?.id || "");
  const [builderDevice, setBuilderDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Drag-and-drop section reordering state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragWidgetType, setDragWidgetType] = useState<SectionType | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Widget palette (choose which section/widget type to add)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sectionId: string;
  } | null>(null);

  // Side Drawer Editor State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"content" | "style">("content");

  // New Page Modal State
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const selectedSection = activePage?.sections.find((s) => s.id === selectedSectionId);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  }

  // Handle Context Menu (Right Click)
  function handleContextMenu(e: React.MouseEvent, sectionId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sectionId,
    });
    setSelectedSectionId(sectionId);
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  // ─── PAGE HANDLERS ──────────────────────────────────────────────────────────

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    if (!newPageData.title || !newPageData.slug) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/webpage-editor/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageData.title,
          slug: newPageData.slug,
          seoTitle: newPageData.seoTitle || newPageData.title,
          seoDescription: newPageData.seoDescription,
          status: "published",
          sections: [
            {
              id: `sec-${Date.now()}`,
              type: "hero",
              title: newPageData.title,
              subtitle: "Welcome to your new custom webpage.",
              ctaText: "Explore Now",
              ctaLink: "#",
            },
          ],
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.page) {
        setPages((prev) => [data.page, ...prev]);
        setActivePageId(data.page.id);
        setIsNewPageOpen(false);
        setNewPageData({ title: "", slug: "", seoTitle: "", seoDescription: "" });
        showToast("Page created successfully!");
      }
    } catch {
      setSaving(false);
    }
  }

  async function handleSaveActivePage() {
    if (!activePage) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/webpage-editor/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePage),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.page) {
        setPages((prev) => prev.map((p) => (p.id === data.page.id ? data.page : p)));
        showToast("Page saved & published to live website!");
        router.refresh();
      }
    } catch {
      setSaving(false);
    }
  }

  // Update one page's metadata (e.g. route override, publish status) and persist.
  // When a route override is assigned, it's cleared from any other page first so a
  // route is only ever taken over by one page.
  async function savePageMeta(pageId: string, updates: Partial<CustomPage>) {
    const route = updates.targetRoute;
    const next = pages.map((p) => {
      if (p.id === pageId) return { ...p, ...updates };
      if (route && p.targetRoute === route) return { ...p, targetRoute: undefined };
      return p;
    });
    const changed = next.filter((p) => JSON.stringify(p) !== JSON.stringify(pages.find((o) => o.id === p.id)));
    setPages(next);
    try {
      for (const p of changed) {
        const res = await fetch("/api/admin/webpage-editor/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const data = await res.json();
        if (res.ok && data.page) setPages((prev) => prev.map((x) => (x.id === data.page.id ? data.page : x)));
      }
      showToast("Page settings saved.");
      router.refresh();
    } catch {
      showToast("Could not save page settings.");
    }
  }

  async function handleDeletePage(id: string) {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await fetch(`/api/admin/webpage-editor/pages?id=${id}`, { method: "DELETE" });
      setPages((prev) => prev.filter((p) => p.id !== id));
      showToast("Page deleted.");
    } catch {}
  }

  // ─── BUILDER SECTION HANDLERS ────────────────────────────────────────────────

  function addSection(type: SectionType, targetIndex?: number) {
    if (!activePage) return;
    const newSection: SectionBlock = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title: `${type.toUpperCase()} Section`,
      subtitle: "Customize this section text and styles using the visual editor.",
      items:
        type === "features" || type === "faq" || type === "testimonials" || type === "stats"
          ? [
              { id: `it-1`, title: "Feature One", description: "Detail description goes here." },
              { id: `it-2`, title: "Feature Two", description: "Detail description goes here." },
              { id: `it-3`, title: "Feature Three", description: "Detail description goes here." },
            ]
          : undefined,
      grid:
        type === "columns"
          ? [
              { id: `col-${Date.now()}-1`, html: "<h3>Column 1</h3><p>Add your content here.</p>" },
              { id: `col-${Date.now()}-2`, html: "<h3>Column 2</h3><p>Add your content here.</p>" },
            ]
          : undefined,
      formSlug: type === "form" ? forms[0]?.slug : undefined,
    };

    let updatedSections = [...activePage.sections];
    if (typeof targetIndex === "number") {
      updatedSections.splice(targetIndex, 0, newSection);
    } else {
      updatedSections.push(newSection);
    }

    const updatedPage = { ...activePage, sections: updatedSections };
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? updatedPage : p)));
    setSelectedSectionId(newSection.id);
    setIsInspectorOpen(true);
    showToast(`Added ${type} section`);
  }

  function updateSection(sectionId: string, updates: Partial<SectionBlock>) {
    if (!activePage) return;
    const updatedSections = activePage.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s));
    const updatedPage = { ...activePage, sections: updatedSections };
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? updatedPage : p)));
  }

  // Set the number of columns in the selected "columns" section (2–4).
  function setColumnCount(sectionId: string, n: number) {
    const sec = activePage?.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    let grid = [...(sec.grid || [])];
    while (grid.length < n) grid.push({ id: `col-${Date.now()}-${grid.length}`, html: "" });
    if (grid.length > n) grid = grid.slice(0, n);
    updateSection(sectionId, { grid });
  }

  // Edit one column's HTML/content.
  function updateColumnHtml(sectionId: string, colId: string, html: string) {
    const sec = activePage?.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const grid = (sec.grid || []).map((c) => (c.id === colId ? { ...c, html } : c));
    updateSection(sectionId, { grid });
  }

  function moveSection(index: number, direction: "up" | "down") {
    if (!activePage) return;
    const sections = [...activePage.sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    const updatedPage = { ...activePage, sections };
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? updatedPage : p)));
  }

  // Reorder a section from one position to another (drag-and-drop).
  function reorderSections(from: number, to: number) {
    if (!activePage || from === to || from < 0 || to < 0) return;
    const sections = [...activePage.sections];
    if (from >= sections.length || to >= sections.length) return;
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    const updatedPage = { ...activePage, sections };
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? updatedPage : p)));
  }

  function removeSection(sectionId: string) {
    if (!activePage) return;
    const sections = activePage.sections.filter((s) => s.id !== sectionId);
    const updatedPage = { ...activePage, sections };
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? updatedPage : p)));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    showToast("Section removed.");
  }

  // ─── NAV LINK HANDLERS ─────────────────────────────────────────────────────

  async function handleSaveNav() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/webpage-editor/nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nav),
      });

      if (res.ok) {
        showToast("Navigation links updated in real-time!");
      }
      setSaving(false);
    } catch {
      setSaving(false);
    }
  }

  function addHeaderLink() {
    const newLink: NavItemLink = {
      id: `nav-${Date.now()}`,
      label: "New Page Link",
      url: "/p/new-link",
      order: nav.headerLinks.length + 1,
    };
    setNav({ ...nav, headerLinks: [...nav.headerLinks, newLink] });
    showToast("Added navigation link");
  }

  function deleteHeaderLink(id: string) {
    setNav({ ...nav, headerLinks: nav.headerLinks.filter((l) => l.id !== id) });
  }

  return (
    <div className="min-h-screen space-y-6 font-sans select-none" onClick={closeContextMenu}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl text-xs font-semibold border border-brand/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP ELEMENTOR BUILDER HEADER BAR */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-4 rounded-2xl bg-slate-950 p-4 text-white shadow-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            <span className="font-extrabold text-sm tracking-wide text-white">
              ELEMENTOR VISUAL THEME EDITOR
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Tab Selection */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === "builder" ? "bg-brand text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              🎨 Visual Builder Preview
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === "pages" ? "bg-brand text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              📄 Manage Pages ({pages.length})
            </button>
            <button
              onClick={() => setActiveTab("nav")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === "nav" ? "bg-brand text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              🔗 Header Navigation Links
            </button>
          </div>
        </div>

        {/* Page Switcher & View Devices & Action Buttons */}
        <div className="flex items-center gap-3">
          {activeTab === "builder" && (
            <>
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                <span className="px-2 text-[11px] font-bold text-slate-400">Page:</span>
                <select
                  value={activePageId}
                  onChange={(e) => setActivePageId(e.target.value)}
                  className="rounded-lg bg-slate-950 px-2.5 py-1 font-extrabold text-white outline-none cursor-pointer"
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.slug === "/" ? "Homepage" : `/${p.slug}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Device View Breakpoints */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  onClick={() => setBuilderDevice("desktop")}
                  className={`p-1.5 rounded-lg transition ${
                    builderDevice === "desktop" ? "bg-slate-800 text-brand" : "text-slate-400 hover:text-white"
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBuilderDevice("tablet")}
                  className={`p-1.5 rounded-lg transition ${
                    builderDevice === "tablet" ? "bg-slate-800 text-brand" : "text-slate-400 hover:text-white"
                  }`}
                  title="Tablet Preview"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBuilderDevice("mobile")}
                  className={`p-1.5 rounded-lg transition ${
                    builderDevice === "mobile" ? "bg-slate-800 text-brand" : "text-slate-400 hover:text-white"
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* New Page Creator Button */}
          <button
            onClick={() => setIsNewPageOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer border border-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Page</span>
          </button>

          {/* Save & Publish Button */}
          <button
            onClick={activeTab === "nav" ? handleSaveNav : handleSaveActivePage}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save &amp; Publish Real-Time</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: VISUAL BUILDER CANVAS PREVIEW ─────────────────────────────────── */}
      {activeTab === "builder" && (
        <div className="flex gap-6">
          {/* Main Visual Frontend Scrollable Canvas Container */}
          <div
            className={`flex-1 transition-all duration-300 mx-auto ${
              builderDevice === "tablet"
                ? "max-w-2xl"
                : builderDevice === "mobile"
                ? "max-w-sm"
                : "w-full"
            }`}
          >
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
              
              {/* TOP FRONTEND HEADER NAVBAR PREVIEW */}
              <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between text-white">
                <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
                  <Building2 className="h-6 w-6 text-brand" />
                  <span>PlotsnHomes</span>
                </Link>

                <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300">
                  {nav.headerLinks.map((link) => (
                    <span key={link.id} className="hover:text-brand cursor-pointer transition">
                      {link.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sign in</span>
                  <span className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-extrabold">
                    Sign out
                  </span>
                </div>
              </div>

              {/* LIVE FRONTEND SCROLLABLE SECTIONS LIST */}
              <div className="p-4 sm:p-6 space-y-6 bg-slate-950 min-h-[700px]">
                {activePage?.sections.map((section, index) => {
                  const isSelected = selectedSectionId === section.id;
                  return (
                    <div
                      key={section.id}
                      onContextMenu={(e) => handleContextMenu(e, section.id)}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setIsInspectorOpen(true);
                      }}
                      onDragOver={(e) => {
                        if (dragIndex === null && dragWidgetType === null) return;
                        e.preventDefault();
                        if (dragOverIndex !== index) setDragOverIndex(index);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragWidgetType !== null) {
                          // Dropped a widget from the palette → insert it here.
                          addSection(dragWidgetType, index);
                          setDragWidgetType(null);
                        } else if (dragIndex !== null) {
                          reorderSections(dragIndex, index);
                        }
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`group relative rounded-3xl transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-brand shadow-2xl scale-[1.005]"
                          : "hover:ring-2 hover:ring-brand/50"
                      } ${dragOverIndex === index && dragIndex !== null && dragIndex !== index ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950" : ""} ${dragIndex === index ? "opacity-40" : ""}`}
                    >
                      {/* Elementor Floating Action Bar Overlay */}
                      <div className="absolute -top-3.5 left-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900 border border-brand/40 text-white rounded-full px-3 py-1 text-[10px] font-extrabold shadow-xl">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDragIndex(index);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setDragOverIndex(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title="Drag to reorder this section"
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-brand"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-brand uppercase tracking-wider">{section.type}</span>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSectionId(section.id);
                            setIsInspectorOpen(true);
                          }}
                          className="hover:text-brand flex items-center gap-1"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "up");
                          }}
                          disabled={index === 0}
                          className="hover:text-brand disabled:opacity-30"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, "down");
                          }}
                          disabled={index === activePage.sections.length - 1}
                          className="hover:text-brand disabled:opacity-30"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                          className="hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Section Content Render */}
                      <SectionRenderer section={section} />
                    </div>
                  );
                })}

                {/* ADD NEW SECTION — widget palette (also a drop zone to append) */}
                <div
                  className={`pt-4 ${dragWidgetType ? "rounded-2xl ring-2 ring-dashed ring-emerald-400/70" : ""}`}
                  onDragOver={(e) => { if (dragWidgetType) e.preventDefault(); }}
                  onDrop={(e) => {
                    if (!dragWidgetType) return;
                    e.preventDefault();
                    addSection(dragWidgetType);
                    setDragWidgetType(null);
                    setDragOverIndex(null);
                  }}
                >
                  {!showWidgetPicker ? (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowWidgetPicker(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-brand text-slate-400 hover:text-brand font-bold text-xs transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Section</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Choose a widget</span>
                        <button type="button" onClick={() => setShowWidgetPicker(false)} className="text-slate-500 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {WIDGET_TYPES.map((w) => {
                          const WIcon = w.icon;
                          return (
                            <button
                              key={w.type}
                              type="button"
                              draggable
                              onDragStart={() => setDragWidgetType(w.type)}
                              onDragEnd={() => { setDragWidgetType(null); setDragOverIndex(null); }}
                              onClick={() => {
                                addSection(w.type);
                                setShowWidgetPicker(false);
                              }}
                              title="Click to add, or drag onto the page"
                              className="flex cursor-grab flex-col items-start gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-left transition hover:border-brand hover:bg-slate-800 active:cursor-grabbing"
                            >
                              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                                <WIcon className="h-3.5 w-3.5 text-brand" /> {w.label}
                              </span>
                              <span className="text-[10px] leading-tight text-slate-400">{w.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE INSPECTOR / STYLE CUSTOMIZER DRAWER */}
          {isInspectorOpen && selectedSection && (
            <div className="w-80 shrink-0 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-5 sticky top-24 self-start max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="h-4 w-4 text-brand-hover" />
                    Elementor Inspector
                  </h3>
                  <p className="text-[11px] text-slate-500">Editing {selectedSection.type} section</p>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Inspector Tabs: Content & Style */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setInspectorTab("content")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                    inspectorTab === "content" ? "bg-white dark:bg-slate-900 text-brand-hover dark:text-brand shadow-xs" : "text-slate-500"
                  }`}
                >
                  📝 Content
                </button>
                <button
                  onClick={() => setInspectorTab("style")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                    inspectorTab === "style" ? "bg-white dark:bg-slate-900 text-brand-hover dark:text-brand shadow-xs" : "text-slate-500"
                  }`}
                >
                  🎨 Typography &amp; Style
                </button>
              </div>

              {/* CONTENT TAB */}
              {inspectorTab === "content" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Section Title / Headline
                    </label>
                    <input
                      type="text"
                      value={selectedSection.title || ""}
                      onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subtitle / Tagline
                    </label>
                    <textarea
                      rows={2}
                      value={selectedSection.subtitle || ""}
                      onChange={(e) => updateSection(selectedSection.id, { subtitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-xs outline-none focus:border-brand"
                    />
                  </div>

                  {selectedSection.type === "hero" || selectedSection.type === "cta" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Primary Button Text
                        </label>
                        <input
                          type="text"
                          value={selectedSection.ctaText || ""}
                          onChange={(e) => updateSection(selectedSection.id, { ctaText: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Primary Button Link
                        </label>
                        <input
                          type="text"
                          value={selectedSection.ctaLink || ""}
                          onChange={(e) => updateSection(selectedSection.id, { ctaLink: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono outline-none focus:border-brand"
                        />
                      </div>
                    </>
                  ) : null}

                  {selectedSection.type === "rawHtml" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Custom code (HTML + CSS + JavaScript)
                      </label>
                      <textarea
                        rows={10}
                        spellCheck={false}
                        value={selectedSection.rawCode || ""}
                        onChange={(e) => updateSection(selectedSection.id, { rawCode: e.target.value })}
                        placeholder={"<div id=\"app\">Hello</div>\n<script>document.getElementById('app').textContent = 'JS works: ' + (2 + 2);</script>"}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-brand"
                      />
                      <p className="mt-1 text-[10px] leading-snug text-slate-500">
                        Runs in a <b>sandboxed iframe</b> — isolated from the rest of the site (can&apos;t read cookies or other pages), so it&apos;s safe to embed maps, forms or small scripts.
                      </p>
                    </div>
                  ) : null}

                  {selectedSection.type === "form" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Which form to show</label>
                      {forms.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-400">
                          No forms yet — build one under Communications → Forms, then it appears here.
                        </p>
                      ) : (
                        <select
                          value={selectedSection.formSlug || ""}
                          onChange={(e) => updateSection(selectedSection.id, { formSlug: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand"
                        >
                          <option value="">Select a form…</option>
                          {forms.map((f) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
                        </select>
                      )}
                      <p className="mt-1 text-[10px] leading-snug text-slate-500">
                        The live form is embedded — edits you make in Forms show here automatically, and submissions flow into your CRM.
                      </p>
                    </div>
                  ) : null}

                  {selectedSection.type === "columns" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Number of columns
                        </label>
                        <div className="flex gap-2">
                          {[2, 3, 4].map((n) => {
                            const active = (selectedSection.grid?.length || 2) === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setColumnCount(selectedSection.id, n)}
                                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                  active
                                    ? "border-brand bg-brand/10 text-brand-hover"
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand/50"
                                }`}
                              >
                                {n} columns
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {(selectedSection.grid || []).map((col, i) => (
                        <div key={col.id}>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Column {i + 1} content (HTML / CSS / JS)
                          </label>
                          <textarea
                            rows={5}
                            spellCheck={false}
                            value={col.html || ""}
                            onChange={(e) => updateColumnHtml(selectedSection.id, col.id, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-brand"
                          />
                        </div>
                      ))}
                      <p className="text-[10px] leading-snug text-slate-500">
                        Each column renders in its own sandboxed frame and the row <b>stacks vertically on mobile</b>.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TYPOGRAPHY & STYLE TAB */}
              {inspectorTab === "style" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Font Family Style
                    </label>
                    <select
                      value={selectedSection.fontFamily || "font-sans"}
                      onChange={(e) => updateSection(selectedSection.id, { fontFamily: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Text Alignment
                    </label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateSection(selectedSection.id, { alignment: align })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold capitalize border ${
                            selectedSection.alignment === align
                              ? "bg-brand text-white border-brand"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Background Color / Hex
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={selectedSection.bgColor || "#0f172a"}
                        onChange={(e) => updateSection(selectedSection.id, { bgColor: e.target.value })}
                        className="h-8 w-8 rounded-lg border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedSection.bgColor || ""}
                        onChange={(e) => updateSection(selectedSection.id, { bgColor: e.target.value })}
                        placeholder="#0f172a"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Background Image URL
                    </label>
                    <input
                      type="text"
                      value={selectedSection.bgImage || ""}
                      onChange={(e) => updateSection(selectedSection.id, { bgImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => removeSection(selectedSection.id)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Section
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: MANAGE PAGES ─────────────────────────────────────────────────── */}
      {activeTab === "pages" && (
        <div className="space-y-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Custom Pages &amp; Slugs</h2>
              <p className="text-xs text-slate-500">Create new pages or edit page metadata and URL routes.</p>
            </div>
            <button
              onClick={() => setIsNewPageOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create New Page
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pages.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{p.title}</h3>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-brand-hover dark:text-brand mt-1">
                      {p.slug === "/" ? "Homepage (/)" : `/p/${p.slug}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setActivePageId(p.id);
                        setActiveTab("builder");
                      }}
                      className="px-3 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-extrabold cursor-pointer"
                    >
                      Visual Edit
                    </button>
                  </div>
                </div>

                {/* Route takeover + publish controls */}
                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Takes over page
                    </label>
                    <select
                      value={p.targetRoute || ""}
                      onChange={(e) => savePageMeta(p.id, { targetRoute: e.target.value || undefined })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-brand"
                    >
                      <option value="">— None (shows at /p/{p.slug}) —</option>
                      {OVERRIDABLE_ROUTES.map((r) => (
                        <option key={r.route} value={r.route}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      value={p.status}
                      onChange={(e) => savePageMeta(p.id, { status: e.target.value as CustomPage["status"] })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-brand"
                    >
                      <option value="published">Published (live)</option>
                      <option value="draft">Draft (hidden)</option>
                    </select>
                  </div>
                </div>
                {p.targetRoute && (
                  <p className="text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                    When <b>published</b>, this replaces the real {OVERRIDABLE_ROUTES.find((r) => r.route === p.targetRoute)?.label || p.targetRoute} page. Set to Draft to restore the original.
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{p.sections.length} Sections</span>
                  {p.slug !== "/" && (
                    <button
                      onClick={() => handleDeletePage(p.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: NAVIGATION MENU LINKS ────────────────────────────────────────── */}
      {activeTab === "nav" && (
        <div className="space-y-6 max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                Header Navigation Links
              </h3>
              <p className="text-xs text-slate-500">Manage links shown on top header of the website.</p>
            </div>
            <button
              onClick={addHeaderLink}
              className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Link
            </button>
          </div>

          <div className="space-y-3">
            {nav.headerLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const updated = nav.headerLinks.map((l) =>
                      l.id === link.id ? { ...l, label: e.target.value } : l
                    );
                    setNav({ ...nav, headerLinks: updated });
                  }}
                  placeholder="Link Label (e.g. Properties)"
                  className="w-44 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold outline-none"
                />

                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => {
                    const updated = nav.headerLinks.map((l) =>
                      l.id === link.id ? { ...l, url: e.target.value } : l
                    );
                    setNav({ ...nav, headerLinks: updated });
                  }}
                  placeholder="URL (/properties)"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-mono text-xs outline-none"
                />

                <button
                  onClick={() => deleteHeaderLink(link.id)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ELEMENTOR RIGHT-CLICK CONTEXT MENU POPUP ──────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-50 w-56 rounded-2xl bg-slate-900 border border-brand/40 text-white shadow-2xl p-1.5 text-xs font-bold space-y-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-brand tracking-widest border-b border-slate-800">
            Elementor Actions
          </div>
          <button
            onClick={() => {
              setSelectedSectionId(contextMenu.sectionId);
              setIsInspectorOpen(true);
              setInspectorTab("content");
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-brand flex items-center gap-2 cursor-pointer"
          >
            ✏️ Edit Section Content
          </button>
          <button
            onClick={() => {
              setSelectedSectionId(contextMenu.sectionId);
              setIsInspectorOpen(true);
              setInspectorTab("style");
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-brand flex items-center gap-2 cursor-pointer"
          >
            🎨 Typography &amp; Style Customizer
          </button>
          <button
            onClick={() => {
              addSection("cta", activePage.sections.findIndex((s) => s.id === contextMenu.sectionId));
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-brand flex items-center gap-2 cursor-pointer"
          >
            ➕ Add Section Above
          </button>
          <button
            onClick={() => {
              addSection("cta", activePage.sections.findIndex((s) => s.id === contextMenu.sectionId) + 1);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-brand flex items-center gap-2 cursor-pointer"
          >
            ➕ Add Section Below
          </button>
          <div className="border-t border-slate-800 my-1" />
          <button
            onClick={() => {
              removeSection(contextMenu.sectionId);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950 hover:text-rose-400 flex items-center gap-2 cursor-pointer"
          >
            🗑️ Delete Section
          </button>
        </div>
      )}

      {/* ─── NEW PAGE MODAL ────────────────────────────────────────────────────── */}
      {isNewPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                Create New Custom Page
              </h3>
              <button onClick={() => setIsNewPageOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  required
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                  placeholder="e.g. Investor Guide"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Route / Slug
                </label>
                <input
                  type="text"
                  required
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                  placeholder="e.g. investor-guide"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-mono outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPageOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold cursor-pointer"
                >
                  {saving ? "Creating..." : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
