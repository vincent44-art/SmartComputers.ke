import type { MetadataRoute } from "next";

import {
  fetchBlogPosts,
  fetchCategories,
  fetchProducts,
} from "@/lib/services";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartcomputers.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/deals",
    "/search",
    "/blog",
    "/about",
    "/contact",
    "/shipping",
    "/returns",
    "/careers",
    "/privacy",
    "/terms",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [categories, products, posts] = await Promise.all([
      fetchCategories(),
      fetchProducts({ perPage: 60 }),
      fetchBlogPosts({ page: 1 }),
    ]);
    const categoryRoutes = categories.map((c) => ({
      url: `${siteUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    const productRoutes = products.items.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    const blogRoutes = posts.items.map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
