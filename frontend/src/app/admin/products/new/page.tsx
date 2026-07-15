"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import {
  FiArrowLeft,
  FiChevronDown,
  FiImage,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SubmitHandler } from "react-hook-form";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  createAdminProduct,
  fetchCategories,
  uploadAdminProductImage,
} from "@/lib/services";
import type { AdminProductInput } from "@/lib/services";


const CONDITIONS = ["new", "refurbished"] as const;

// client-side hint only; backend stores image URLs.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const DRAFT_KEY = "admin_product_draft_v1";


const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  categoryId: z.number().int().refine((v) => v > 0, "Category is required"),
  brandId: z.number().int().nullable().optional(),

  condition: z.enum(CONDITIONS),

  price: z.coerce.number().nonnegative("Price must be >= 0"),
  compareAtPrice: z.coerce.number().nullable().optional(),

  stock: z.coerce.number().int().nonnegative("Stock must be >= 0"),
  sku: z.string().trim().min(2).optional().or(z.literal("")),

  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),

  images: z
    .array(
      z.object({
        // Allow empty slot; it becomes valid once the user uploads/pastes an image.
        url: z
          .string()
          .optional()
          .transform((v) => (v ?? "").trim())
          .refine((v) => v.length === 0 || /^https?:\/\//i.test(v) || v.startsWith("/"), {
            message: "Image URL must start with http(s) or be a backend-relative URL",
          })
          .optional(),
        alt: z.string().optional().nullable(),
      })
    )
    .refine((arr) => arr.some((i) => (i.url ?? "").trim().length > 0), {
      message: "At least 1 image is required",
    }),

  // JSON spec payload
  specs: z
    .record(z.string().min(1), z.string().nullable().optional())
    .optional()
    .default({}),

  // Denormalized fields
  processor: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  display: z.string().optional().nullable(),
  graphics: z.string().optional().nullable(),

  warranty: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

function toSpecs(values: FormValues): Record<string, string | null> | undefined {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(values.specs ?? {})) {
    out[k] = (v ?? null) as string | null;
  }
  if (values.processor != null) out.processor = values.processor;
  if (values.ram != null) out.ram = values.ram;
  if (values.storage != null) out.storage = values.storage;
  if (values.display != null) out.display = values.display;
  if (values.graphics != null) out.graphics = values.graphics;
  return Object.keys(out).length ? out : undefined;
}

function buildPayload(values: FormValues): AdminProductInput {
  return {
    name: values.name,
    price: values.price,
    compareAtPrice: values.compareAtPrice ?? null,
    stock: values.stock,
    categoryId: values.categoryId,

    brandId: values.brandId ?? null,
    shortDescription: values.shortDescription ?? undefined,
    description: values.description ?? undefined,

    processor: values.processor ?? undefined,
    ram: values.ram ?? undefined,
    storage: values.storage ?? undefined,
    display: values.display ?? undefined,
    graphics: values.graphics ?? undefined,

    warranty: values.warranty ?? undefined,
    sku: values.sku ? values.sku : undefined,
    condition: values.condition,

    isFeatured: values.isFeatured,
    isBestSeller: values.isBestSeller,
    isFlashSale: values.isFlashSale,

    specs: toSpecs(values),
    images: values.images.map((i) => i.url),
  } as AdminProductInput;
}

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

export default function AddProductPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const defaultCategoryId = categories?.[0]?.id ?? 0;

  const form = useForm<FormValues>({
    // cast to avoid RHF/zod generic mismatch in this repo
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      categoryId: defaultCategoryId,
      brandId: null,
      condition: "new",
      price: 0,
      compareAtPrice: null,
      stock: 0,
      sku: "",
      isFeatured: false,
      isBestSeller: false,
      isFlashSale: false,
      images: [{ url: "", alt: null }],
      specs: {},
      processor: "",
      ram: "",
      storage: "",
      display: "",
      graphics: "",
      warranty: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = form;

  const imagesArray = useFieldArray({ control, name: "images" });
  const values = watch();

  const [draftLoaded, setDraftLoaded] = useState(false);
  const initialLoadRef = useRef(true);
  const [serverError, setServerError] = useState<string>("");

  useEffect(() => {
    if (draftLoaded) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return setDraftLoaded(true);
      const parsed = JSON.parse(raw) as Partial<FormValues>;

      reset((prev) => ({
        ...prev,
        ...(parsed as any),
        categoryId:
          typeof (parsed as any).categoryId === "number" &&
          (parsed as any).categoryId > 0
            ? (parsed as any).categoryId
            : prev.categoryId,
        images:
          Array.isArray((parsed as any).images) && (parsed as any).images.length
            ? (parsed as any).images
            : prev.images,
      }));
    } catch {
      // ignore
    } finally {
      setDraftLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCategoryId, draftLoaded]);

  useEffect(() => {
    if (!draftLoaded) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form.getValues()));
    }, 500);
    return () => window.clearTimeout(t);
  }, [draftLoaded, values, form]);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const createMutation = useMutation({
    mutationFn: async (payload: AdminProductInput) => createAdminProduct(payload),
    onSuccess: async () => {
      window.localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      router.push(`/admin/products`);
    },
    onError: (err) => setServerError(apiErrorMessage(err)),
  });

  const onSubmit = ((data) => {
    setServerError("");
    createMutation.mutate(buildPayload(data));
  }) satisfies SubmitHandler<FormValues>;

  // Ctrl/Cmd+S save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void (handleSubmit(onSubmit as any) as any)();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmit, onSubmit]);

  const hasValidCategories = (categories?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <FiArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">Add Product</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.localStorage.removeItem(DRAFT_KEY)}
            className="btn-ghost"
          >
            Clear draft
          </button>

          <button
            type="button"
            onClick={() => void (handleSubmit(onSubmit as any) as any)()}
            disabled={createMutation.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {createMutation.isPending ? "Saving…" : <><FiSave className="h-4 w-4" /> Save product</>}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Section
            title="Basic Information"
            defaultOpen
            icon={<span className="badge bg-primary/10 text-primary">1</span>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product name *
                </label>
                <input className="input" placeholder="e.g. Dell Inspiron 16" {...register("name")} />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category *</label>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    className="input"
                    disabled={!hasValidCategories}
                    {...register("categoryId", { valueAsNumber: true })}
                  >
                    <option value={0}>Select category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.categoryId && (
                  <p className="text-sm text-danger">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Short description</label>
              <textarea className="input min-h-[90px]" {...register("shortDescription")} />
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full description</label>
              <textarea className="input min-h-[130px]" {...register("description")} />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Condition</label>
                <select className="input" {...register("condition")}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Visibility & status</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register("isFeatured")} /> Featured
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register("isBestSeller")} /> Best seller
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register("isFlashSale")} /> Flash sale
                  </label>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Pricing" icon={<span className="badge bg-primary/10 text-primary">2</span>}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Regular price *</label>
                <input type="number" step="0.01" className="input" {...register("price", { valueAsNumber: true })} />
                {errors.price && <p className="text-sm text-danger">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sale price</label>
                <input type="number" step="0.01" className="input" {...register("compareAtPrice", { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Currency</label>
                <select className="input" disabled defaultValue="KES">
                  <option value="KES">KES</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Inventory" icon={<span className="badge bg-primary/10 text-primary">3</span>}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">SKU (optional override)</label>
                <input className="input" placeholder="Auto SKU or enter your own…" {...register("sku")} />
                {errors.sku && <p className="text-sm text-danger">{errors.sku.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quantity *</label>
                <input type="number" className="input" {...register("stock", { valueAsNumber: true })} />
                {errors.stock && <p className="text-sm text-danger">{errors.stock.message}</p>}
              </div>
            </div>
          </Section>

          <Section title="Images & Media" icon={<FiImage className="h-4 w-4 text-primary" />}>
            <div className="space-y-3">
                <div className="card p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Backend expects <span className="font-semibold">image URLs</span>.
                    Use the uploader below to add local images (it uploads and stores the returned URL).
                  </p>
                </div>

                <div className="space-y-3">
                    <div className="space-y-3">
                    {imagesArray.fields.map((field, idx) => (
                      <div key={field.id} className="space-y-2">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <input
                            className="input"
                            placeholder={`Image URL #${idx + 1} (paste internet URL or leave empty)`}
                            {...register(`images.${idx}.url` as const)}
                          />
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-2 text-danger"
                            onClick={() => imagesArray.remove(idx)}
                            disabled={imagesArray.fields.length <= 1}
                          >
                            <FiTrash2 className="h-4 w-4" /> Remove
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Supports remote images (http/https). Saved as-is.
                        </p>
                      </div>
                    ))}

                    {errors.images && (
                      <p className="text-sm text-danger">{String(errors.images.message ?? "Invalid images")}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-ghost inline-flex items-center gap-2"
                        onClick={() => imagesArray.append({ url: "", alt: null })}
                      >
                        <FiPlus className="h-4 w-4" /> Add image
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="grid gap-3 md:grid-cols-[1fr_260px]">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Upload from computer
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          Choose a file; the returned URL will be saved into the first empty image slot.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Max image size hint: {(MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0)}MB.
                        </p>
                      </div>

                      <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const current = form.getValues();
                          const emptyIndex = current.images.findIndex((i) => !i.url);
                          const indexToSet = emptyIndex >= 0 ? emptyIndex : current.images.length;

                          if (indexToSet >= current.images.length) {
                            imagesArray.append({ url: "", alt: null });
                          }

                          setServerError("");
                          try {
                            const uploaded = await uploadAdminProductImage(file);
                            form.setValue(`images.${indexToSet}.url` as const, uploaded.url, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          } catch (err: any) {
                            setServerError(String(err?.message ?? "Upload failed"));
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>

                    {serverError && (
                      <div className="card border border-danger/30 bg-danger/5 p-3 mt-3 text-sm text-danger">
                        {serverError}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <AnimatePresence>
                        {values.images.map((img, idx) => (
                          <motion.div
                            key={`${idx}-${img.url}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/30"
                          >
                            {img.url ? (
                              <Image
                                src={img.url}
                                alt={img.alt ?? "Product image"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 25vw"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No URL</div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
          </Section>

          <Section title="Specifications" icon={<span className="badge bg-primary/10 text-primary">6</span>}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Processor</label>
                <input className="input" {...register("processor")} placeholder="e.g. Intel i7" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">RAM</label>
                <input className="input" {...register("ram")} placeholder="e.g. 16GB" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Storage</label>
                <input className="input" {...register("storage")} placeholder="e.g. 512GB SSD" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Display</label>
                <input className="input" {...register("display")} placeholder="e.g. 15.6 inch" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Graphics</label>
                <input className="input" {...register("graphics")} placeholder="e.g. RTX 3050" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Warranty</label>
                <input className="input" {...register("warranty")} placeholder="e.g. 1 year" />
              </div>
            </div>
          </Section>

          {serverError && (
            <div className="card border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {serverError}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-secondary dark:text-white">Live preview</h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                <p className="mt-1 font-medium text-secondary dark:text-white">{values.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
                <p className="mt-1 text-lg font-bold text-secondary dark:text-white">
                  {values.price ? formatCurrency(Number(values.price), "KES") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Images</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {values.images.slice(0, 4).map((img, idx) => (
                    <div
                      key={`${idx}-${img.url}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/30"
                    >
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={img.alt ?? "Product image"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">—</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Specs summary</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="font-medium">Processor:</span> {values.processor || "—"}
                  </p>
                  <p>
                    <span className="font-medium">RAM:</span> {values.ram || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Storage:</span> {values.storage || "—"}
                  </p>
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2">
                <span className="badge bg-slate-100 text-secondary dark:bg-slate-800">
                  {values.condition.toUpperCase()}
                </span>
                {values.isFeatured && (
                  <span className="badge bg-primary/10 text-primary">Featured</span>
                )}
                {values.isBestSeller && (
                  <span className="badge bg-accent/10 text-accent">Best seller</span>
                )}
                {values.isFlashSale && (
                  <span className="badge bg-warning/10 text-warning">Flash sale</span>
                )}
              </div>

              {errors.name || errors.price || errors.categoryId || errors.images ? (
                <div className="mt-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
                  Fix validation errors to save.
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success">
                  Ready to save.
                </div>
              )}

              <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Keyboard</p>
                <p>Ctrl/⌘ + S to save</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-secondary dark:text-white">Enterprise sections</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Remaining sections (Variants, Shipping, SEO, Related / Frequently Bought Together) are scaffolded for
              backend extensions. Save uses backend-supported fields only.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

