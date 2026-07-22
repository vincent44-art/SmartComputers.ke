"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiChevronDown,
  FiEye,
  FiImage,
  FiSave,
} from "react-icons/fi";
import { z } from "zod";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage, getStoredToken } from "@/lib/api";
import {
  createHeroBanner,
  fetchAdminHeroBanners,
  type HeroBannerInput,
  updateHeroBanner,
} from "@/lib/services";
import type { HeroBanner } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BADGE_OPTIONS = [
  "NEW ARRIVAL",
  "FLASH SALE",
  "HOT DEAL",
  "BACK TO SCHOOL",
  "LIMITED OFFER",
  "EXCLUSIVE",
  "FREE DELIVERY",
];

const PRIMARY_TEXT_SUGGESTIONS = [
  "Shop Now",
  "Buy Now",
  "Explore Collection",
  "Order Today",
];

const SECONDARY_TEXT_SUGGESTIONS = [
  "Learn More",
  "Contact Us",
  "View Deals",
];

const LAYOUT_OPTIONS = [
  { value: "left", label: "Text Left" },
  { value: "center", label: "Text Center" },
  { value: "right", label: "Text Right" },
];

const ANIMATION_OPTIONS = [
  { value: "fade", label: "Fade" },
  { value: "slideLeft", label: "Slide Left" },
  { value: "slideRight", label: "Slide Right" },
  { value: "slideUp", label: "Slide Up" },
  { value: "zoom", label: "Zoom" },
  { value: "none", label: "None" },
];

const DRAFT_KEY = "admin_hero_banner_draft_v1";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  desktopImage: z.string().optional().nullable(),
  mobileImage: z.string().optional().nullable(),
  primaryText: z.string().optional().nullable(),
  primaryUrl: z.string().optional().nullable(),
  secondaryText: z.string().optional().nullable(),
  secondaryUrl: z.string().optional().nullable(),
  layout: z.enum(["left", "center", "right"]).default("left"),
  overlayOpacity: z.coerce.number().min(0).max(1).default(0.3),
  animation: z
    .enum(["fade", "slideLeft", "slideRight", "slideUp", "zoom", "none"])
    .default("fade"),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  publishImmediately: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------
function Section({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer select-none items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm font-semibold text-secondary shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <FiChevronDown className="h-4 w-4 opacity-70 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Image Upload Field
// ---------------------------------------------------------------------------
function ImageUploadField({
  label,
  value,
  onChange,
  accept = "image/*",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = getStoredToken();
      const res = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="input"
          placeholder="Image URL or upload…"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="btn-ghost cursor-pointer inline-flex items-center gap-2">
          {uploading ? (
            <span className="text-sm">Uploading…</span>
          ) : (
            <>
              <FiImage className="h-4 w-4" /> Upload
            </>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
      {value && (
        <div className="relative aspect-[16/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminHeroBannerNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const editId = searchParams.get("id");

  const [serverError, setServerError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const initialLoadRef = useRef(true);

  const { data: allBanners, isLoading: listLoading } = useQuery({
    queryKey: ["admin-hero-banners"],
    queryFn: fetchAdminHeroBanners,
    enabled: !!editId,
  });

  const editingBanner = editId
    ? allBanners?.find((b) => b.id === Number(editId))
    : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      title: "",
      subtitle: "",
      badge: "",
      desktopImage: "",
      mobileImage: "",
      primaryText: "",
      primaryUrl: "",
      secondaryText: "",
      secondaryUrl: "",
      layout: "left",
      overlayOpacity: 0.3,
      animation: "fade",
      displayOrder: 0,
      isActive: true,
      publishImmediately: true,
      startDate: "",
      endDate: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = form;

  const values = watch();

  // Load draft on mount or populate from editing banner
  useEffect(() => {
    if (draftLoaded) return;

    if (editingBanner) {
      reset({
        title: editingBanner.title,
        subtitle: editingBanner.subtitle ?? "",
        badge: editingBanner.badge ?? "",
        desktopImage: editingBanner.desktopImage ?? "",
        mobileImage: editingBanner.mobileImage ?? "",
        primaryText: editingBanner.primaryText ?? "",
        primaryUrl: editingBanner.primaryUrl ?? "",
        secondaryText: editingBanner.secondaryText ?? "",
        secondaryUrl: editingBanner.secondaryUrl ?? "",
        layout: editingBanner.layout,
        overlayOpacity: editingBanner.overlayOpacity,
        animation: editingBanner.animation,
        displayOrder: editingBanner.displayOrder,
        isActive: editingBanner.isActive,
        publishImmediately: !editingBanner.startDate && !editingBanner.endDate,
        startDate: editingBanner.startDate
          ? editingBanner.startDate.slice(0, 16)
          : "",
        endDate: editingBanner.endDate
          ? editingBanner.endDate.slice(0, 16)
          : "",
      });
      setDraftLoaded(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return setDraftLoaded(true);
      const parsed = JSON.parse(raw) as Partial<FormValues>;
      reset((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      // ignore
    } finally {
      setDraftLoaded(true);
    }
  }, [editingBanner, draftLoaded, reset]);

  // Auto-save draft for new banners
  useEffect(() => {
    if (!draftLoaded || editId) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form.getValues()));
    }, 500);
    return () => window.clearTimeout(t);
  }, [draftLoaded, values, form, editId]);

  const createMutation = useMutation({
    mutationFn: async (payload: HeroBannerInput) => {
      if (editingBanner) {
        return updateHeroBanner(editingBanner.id, payload);
      }
      return createHeroBanner(payload);
    },
    onSuccess: () => {
      window.localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries({ queryKey: ["admin-hero-banners"] });
      router.push("/admin/hero-banners");
    },
    onError: (err) => setServerError(apiErrorMessage(err)),
  });

  const onSubmit = (data: FormValues) => {
    setServerError("");

    const payload: HeroBannerInput = {
      title: data.title,
      subtitle: data.subtitle || null,
      badge: data.badge || null,
      desktopImage: data.desktopImage || null,
      mobileImage: data.mobileImage || null,
      primaryText: data.primaryText || null,
      primaryUrl: data.primaryUrl || null,
      secondaryText: data.secondaryText || null,
      secondaryUrl: data.secondaryUrl || null,
      layout: data.layout,
      overlayOpacity: data.overlayOpacity,
      animation: data.animation,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      startDate: data.publishImmediately ? null : data.startDate || null,
      endDate: data.publishImmediately ? null : data.endDate || null,
    };

    createMutation.mutate(payload);
  };

  // Ctrl/Cmd+S save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSubmit(onSubmit)();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmit, onSubmit]);

  // --- Live Preview ---
  const LivePreview = () => {
    const layoutStyles: Record<string, string> = {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    };

    const animationVariant = {
      fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
      slideLeft: {
        initial: { opacity: 0, x: -60 },
        animate: { opacity: 1, x: 0 },
      },
      slideRight: {
        initial: { opacity: 0, x: 60 },
        animate: { opacity: 1, x: 0 },
      },
      slideUp: {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
      },
      zoom: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
      },
      none: { initial: {}, animate: {} },
    };

    const anim =
      animationVariant[values.animation as keyof typeof animationVariant] ||
      animationVariant.fade;

    return (
      <div className="relative h-[400px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Background image */}
        {values.desktopImage ? (
          <img
            src={values.desktopImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: values.overlayOpacity }}
        />

        {/* Content */}
        <div
          className={`relative z-10 flex h-full ${layoutStyles[values.layout] || layoutStyles.left} justify-center px-8`}
        >
          <div className="flex flex-col justify-center gap-4 max-w-xl">
            {values.badge && (
              <motion.span
                {...anim}
                transition={{ duration: 0.5, delay: 0 }}
                className="inline-block w-fit rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md"
              >
                {values.badge}
              </motion.span>
            )}

            <motion.h2
              {...anim}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-bold leading-tight text-white md:text-5xl"
            >
              {values.title || "Banner Title"}
            </motion.h2>

            {values.subtitle && (
              <motion.p
                {...anim}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-white/80"
              >
                {values.subtitle}
              </motion.p>
            )}

            <motion.div
              {...anim}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              {values.primaryText && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg">
                  {values.primaryText}
                </span>
              )}
              {values.secondaryText && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                  {values.secondaryText}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  if (editId && !editingBanner && listLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <FiArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">
            {editingBanner ? "Edit Banner" : "New Banner"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!editId && (
            <button
              type="button"
              onClick={() => window.localStorage.removeItem(DRAFT_KEY)}
              className="btn-ghost"
            >
              Clear draft
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={createMutation.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {createMutation.isPending ? (
              "Saving…"
            ) : (
              <>
                <FiSave className="h-4 w-4" />{" "}
                {editingBanner ? "Update Banner" : "Save Banner"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
        {/* Left: Form */}
        <div className="space-y-4">
          <Section
            title="Banner Content"
            defaultOpen
            icon={<span className="badge bg-primary/10 text-primary">1</span>}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Main Heading *
                </label>
                <input
                  className="input"
                  placeholder="e.g. Summer Sale is Live!"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-danger">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Subtitle
                </label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="e.g. Up to 50% off on selected items"
                  {...register("subtitle")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Promotional Badge
                </label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setValue("badge", badge)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        values.badge === badge
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
                <input
                  className="input mt-2"
                  placeholder="Or type a custom badge…"
                  {...register("badge")}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Banner Images"
            icon={<FiImage className="h-4 w-4 text-primary" />}
          >
            <div className="space-y-4">
              <ImageUploadField
                label="Desktop Banner (16:5 recommended)"
                value={values.desktopImage}
                onChange={(url) => setValue("desktopImage", url)}
              />
              <ImageUploadField
                label="Mobile Banner (optional)"
                value={values.mobileImage}
                onChange={(url) => setValue("mobileImage", url)}
              />
            </div>
          </Section>

          <Section
            title="Buttons"
            icon={<span className="badge bg-primary/10 text-primary">2</span>}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Primary Button
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_TEXT_SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => setValue("primaryText", text)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        values.primaryText === text
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Button text"
                    {...register("primaryText")}
                  />
                  <input
                    className="input"
                    placeholder="Destination URL (e.g. /category/laptops)"
                    {...register("primaryUrl")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Secondary Button (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECONDARY_TEXT_SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => setValue("secondaryText", text)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        values.secondaryText === text
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Button text"
                    {...register("secondaryText")}
                  />
                  <input
                    className="input"
                    placeholder="Destination URL"
                    {...register("secondaryUrl")}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Banner Layout & Animation">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Text Position
                </label>
                <select className="input" {...register("layout")}>
                  {LAYOUT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Entrance Animation
                </label>
                <select className="input" {...register("animation")}>
                  {ANIMATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Background Overlay
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="flex-1 accent-primary"
                    {...register("overlayOpacity", { valueAsNumber: true })}
                  />
                  <span className="text-sm font-medium text-secondary dark:text-white min-w-[3ch]">
                    {Math.round(values.overlayOpacity * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  {...register("displayOrder", { valueAsNumber: true })}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Scheduling & Status"
            defaultOpen
            icon={<span className="badge bg-primary/10 text-primary">3</span>}
          >
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...register("publishImmediately")}
                />
                <span className="text-sm font-medium text-secondary dark:text-slate-200">
                  Publish Immediately
                </span>
              </label>

              {!values.publishImmediately && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      {...register("startDate")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      {...register("endDate")}
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...register("isActive")}
                />
                <span className="text-sm font-medium text-secondary dark:text-slate-200">
                  Active (show on homepage)
                </span>
              </label>
            </div>
          </Section>

          {serverError && (
            <div className="card border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {serverError}
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <div className="rounded-xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Keyboard
            </p>
            <p>Ctrl/⌘ + S to save</p>
          </div>
        </div>

        {/* Right: Live Preview */}
        <aside className="space-y-4">
          <div className="card p-5 sticky top-24">
            <h2 className="flex items-center gap-2 font-semibold text-secondary dark:text-white">
              <FiEye className="h-4 w-4 text-primary" />
              Live Preview
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              This is how the banner will appear on the homepage.
            </p>
            <div className="mt-4">
              <LivePreview />
            </div>

            {/* Banner Details Summary */}
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Layout</span>
                <span className="font-medium capitalize text-secondary dark:text-slate-200">
                  {values.layout}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Animation</span>
                <span className="font-medium capitalize text-secondary dark:text-slate-200">
                  {values.animation}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Overlay</span>
                <span className="font-medium text-secondary dark:text-slate-200">
                  {Math.round(values.overlayOpacity * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span
                  className={`badge ${
                    values.isActive
                      ? "bg-success/10 text-success"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {values.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {values.primaryText && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Button</span>
                  <span className="font-medium text-secondary dark:text-slate-200">
                    {values.primaryText}
                  </span>
                </div>
              )}
              {values.badge && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Badge</span>
                  <span className="font-medium text-primary">{values.badge}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

