"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiEdit2,
  FiImage,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
} from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  deleteHeroBanner,
  duplicateHeroBanner,
  fetchAdminHeroBanners,
  reorderHeroBanners,
  updateHeroBanner,
} from "@/lib/services";
import type { HeroBanner } from "@/lib/types";

const BADGE_STYLES: Record<string, string> = {
  active: "badge bg-success/10 text-success",
  inactive: "badge bg-slate-100 text-slate-500 dark:bg-slate-800",
  scheduled: "badge bg-primary/10 text-primary",
  expired: "badge bg-danger/10 text-danger",
};

function getBannerStatus(banner: HeroBanner): { label: string; style: string } {
  if (!banner.isActive) return { label: "Inactive", style: BADGE_STYLES.inactive };

  const now = new Date();
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;

  if (start && now < start) return { label: "Scheduled", style: BADGE_STYLES.scheduled };
  if (end && now > end) return { label: "Expired", style: BADGE_STYLES.expired };
  return { label: "Active", style: BADGE_STYLES.active };
}

export default function AdminHeroBannersPage() {
  const qc = useQueryClient();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hero-banners"],
    queryFn: fetchAdminHeroBanners,
  });

  useEffect(() => {
    if (data) setBanners(data);
  }, [data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-hero-banners"] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteHeroBanner,
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateHeroBanner,
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return updateHeroBanner(id, { isActive });
    },
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const moveBanner = (index: number, direction: "up" | "down") => {
    const newBanners = [...banners];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    newBanners.forEach((b, i) => (b.displayOrder = i + 1));
    setBanners(newBanners);

    reorderHeroBanners(
      newBanners.map((b) => ({ id: b.id, displayOrder: b.displayOrder }))
    ).catch(() => invalidate());
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Hero Banners
        </h1>
        <Link href="/admin/hero-banners/new" className="btn-primary">
          <FiPlus className="h-4 w-4" /> Add New Banner
        </Link>
      </div>

      {error && (
        <div className="card border border-danger/30 bg-danger/5 p-3 mt-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Title / Badge</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Buttons</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3" colSpan={9}>
                    <Skeleton className="h-12 w-full" />
                  </td>
                </tr>
              ))}
            {banners.map((banner, index) => {
              const status = getBannerStatus(banner);
              return (
                <tr
                  key={banner.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => moveBanner(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move up"
                      >
                        <FiChevronUp className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-slate-400">{banner.displayOrder}</span>
                      <button
                        onClick={() => moveBanner(index, "down")}
                        disabled={index === banners.length - 1}
                        className="p-0.5 text-slate-400 hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move down"
                      >
                        <FiChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {banner.desktopImage ? (
                        <Image
                          src={banner.desktopImage}
                          alt={banner.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FiImage className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-medium text-secondary dark:text-white">
                        {banner.title}
                      </p>
                      {banner.badge && (
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {banner.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[200px] truncate text-slate-500 dark:text-slate-300">
                      {banner.subtitle || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 text-xs">
                      {banner.primaryText && (
                        <span className="text-secondary dark:text-slate-200">
                          {banner.primaryText}
                        </span>
                      )}
                      {banner.secondaryText && (
                        <span className="block text-slate-400">
                          +{banner.secondaryText}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={status.style}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-300">
                    <div>
                      {banner.startDate ? formatDate(banner.startDate) : "—"}
                    </div>
                    <div>
                      {banner.endDate ? `→ ${formatDate(banner.endDate)}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {banner.updatedAt ? formatDate(banner.updatedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/hero-banners/new?id=${banner.id}`}
                        className="btn-ghost p-2"
                        aria-label="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => duplicateMutation.mutate(banner.id)}
                        className="btn-ghost p-2"
                        aria-label="Duplicate"
                        disabled={duplicateMutation.isPending}
                      >
                        <FiCopy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: banner.id,
                            isActive: !banner.isActive,
                          })
                        }
                        className="btn-ghost p-2"
                        aria-label={banner.isActive ? "Deactivate" : "Activate"}
                      >
                        {banner.isActive ? (
                          <FiToggleRight className="h-4 w-4 text-success" />
                        ) : (
                          <FiToggleLeft className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${banner.title}"?`))
                            deleteMutation.mutate(banner.id);
                        }}
                        className="btn-ghost p-2 text-danger"
                        aria-label="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {banners.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  <FiImage className="mx-auto h-10 w-10 mb-3 text-slate-300" />
                  <p>No hero banners yet.</p>
                  <Link
                    href="/admin/hero-banners/new"
                    className="btn-primary mt-3 inline-flex"
                  >
                    <FiPlus className="h-4 w-4" /> Create your first banner
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

