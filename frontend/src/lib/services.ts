import { api, getStoredToken } from "./api";
import type {

  AdminAnalytics,
  AuthResponse,
  BlogCategory,
  BlogComment,
  BlogPost,
  Cart,
  Category,
  Coupon,
  Facets,
  HeroBanner,
  HomePageData,
  Order,
  Paginated,
  Product,
  ProductVariant,
  RecommendationResponse,
  Review,
  User,
} from "./types";

export interface ProductQuery {
  category?: string;
  q?: string;
  brand?: string[];
  ram?: string[];
  storage?: string[];
  condition?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
  currency?: string;
}


function toParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  });
  return params;
}

export async function fetchProducts(
  query: ProductQuery = {}
): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>("/api/products", {
    params: toParams(query),
  });
  return data;
}



export async function fetchProduct(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/api/products/${slug}`);
  return data;
}

export async function fetchFacets(): Promise<Facets> {
  const { data } = await api.get<Facets>("/api/products/facets");
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/api/categories");
  return data;
}

export async function fetchHomePage(): Promise<HomePageData> {
  const { data } = await api.get<HomePageData>("/api/products/home");
  return data;
}

export async function fetchCart(currency?: string): Promise<Cart> {
  const { data } = await api.get<Cart>("/api/cart", {
    params: currency ? { currency } : undefined,
  });
  return data;
}


export async function addCartItem(
  productId: number,
  quantity = 1,
  variantId?: number
): Promise<Cart> {
  const payload: Record<string, unknown> = { productId, quantity };
  if (variantId !== undefined) payload.variantId = variantId;
  const { data } = await api.post<Cart>("/api/cart/items", payload);
  return data;
}

export async function updateCartItem(
  itemId: number,
  quantity: number
): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/api/cart/items/${itemId}`, {
    quantity,
  });
  return data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/api/cart/items/${itemId}`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<Cart>("/api/cart/items");
  return data;
}

// ---------------------------------------------------------------------------
// Product Variants
// ---------------------------------------------------------------------------
export async function fetchProductVariants(
  productId: number,
  currency?: string
): Promise<ProductVariant[]> {
  const { data } = await api.get<ProductVariant[]>(
    `/api/variants/product/${productId}`,
    { params: currency ? { currency } : undefined }
  );
  return data;
}

export async function fetchVariant(
  variantId: number,
  currency?: string
): Promise<ProductVariant> {
  const { data } = await api.get<ProductVariant>(`/api/variants/${variantId}`, {
    params: currency ? { currency } : undefined,
  });
  return data;
}

export async function changeCartItemVariant(
  itemId: number,
  variantId: number
): Promise<Cart> {
  const { data } = await api.patch<Cart>(
    `/api/cart/items/${itemId}/variant`,
    { variantId }
  );
  return data;
}

export async function addCartItemWithVariant(
  productId: number,
  variantId: number,
  quantity = 1
): Promise<Cart> {
  const { data } = await api.post<Cart>("/api/cart/items", {
    productId,
    variantId,
    quantity,
  });
  return data;
}


export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ coupon: Coupon; discount: number }> {
  const { data } = await api.post("/api/coupons/validate", { code, subtotal });
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/api/auth/me");
  return data;
}

export interface CheckoutPayload {
  email: string;
  phone?: string;
  paymentMethod: string;
  couponCode?: string;
  items: { productId: number; quantity: number }[];
  shippingAddress: Record<string, string>;
  billingAddress?: Record<string, string>;
  notes?: string;
}

export async function createOrder(payload: CheckoutPayload): Promise<Order> {
  const { data } = await api.post<Order>("/api/orders", payload);
  return data;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/api/orders");
  return data;
}

export async function fetchOrder(orderNumber: string): Promise<Order> {
  const { data } = await api.get<Order>(`/api/orders/${orderNumber}`);
  return data;
}

export async function initiatePayment(payload: {
  orderNumber: string;
  method: string;
  phone?: string;
}): Promise<{ provider: string; reference: string; status: string; simulated: boolean; detail: string }> {
  const { data } = await api.post("/api/payments/initiate", payload);
  return data;
}

export async function submitReview(
  slug: string,
  payload: { rating: number; title?: string; body?: string }
): Promise<Review> {
  const { data } = await api.post<Review>(`/api/products/${slug}/reviews`, payload);
  return data;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------
export async function fetchRecommendations(
  currency?: string
): Promise<RecommendationResponse> {
  const { data } = await api.get<RecommendationResponse>(
    "/api/recommendations/cart",
    { params: currency ? { currency } : undefined }
  );
  return data;
}

export async function trackRecommendationClick(
  productId: number,
  position?: number
): Promise<void> {
  await api.post("/api/recommendations/click", { productId, position });
}

export async function trackRecommendationAdded(
  productId: number,
  position?: number
): Promise<void> {
  await api.post("/api/recommendations/added", { productId, position });
}

// ---------------------------------------------------------------------------
// Blog & newsletter
// ---------------------------------------------------------------------------
export async function fetchBlogPosts(params: {
  category?: string;
  q?: string;
  page?: number;
} = {}): Promise<Paginated<BlogPost>> {
  const { data } = await api.get<Paginated<BlogPost>>("/api/blog/posts", {
    params,
  });
  return data;
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  const { data } = await api.get<BlogPost>(`/api/blog/posts/${slug}`);
  return data;
}

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  const { data } = await api.get<BlogCategory[]>("/api/blog/categories");
  return data;
}

export async function addBlogComment(
  slug: string,
  payload: { author: string; body: string }
): Promise<BlogComment> {
  const { data } = await api.post<BlogComment>(
    `/api/blog/posts/${slug}/comments`,
    payload
  );
  return data;
}

export async function subscribeNewsletter(email: string): Promise<void> {
  await api.post("/api/newsletter/subscribe", { email });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const { data } = await api.get<AdminAnalytics>("/api/admin/analytics");
  return data;
}

export async function fetchAdminProducts(
  params: { q?: string; page?: number } = {}
): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>("/api/admin/products", {
    params,
  });
  return data;
}

export interface AdminProductInput {
  name: string;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;
  categoryId: number;
  brandId?: number | null;
  shortDescription?: string;
  description?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  condition?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isFlashSale?: boolean;
  images?: string[];
}

export async function createAdminProduct(
  payload: AdminProductInput
): Promise<Product> {
  const { data } = await api.post<Product>("/api/admin/products", payload);
  return data;
}

export async function uploadAdminProductImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);

  const token = getStoredToken();

  // use fetch instead of axios default JSON instance
  const res = await fetch("/api/admin/uploads/image", {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });


  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as { url: string };
}


export async function updateAdminProduct(
  id: number,
  payload: Partial<AdminProductInput>
): Promise<Product> {
  const { data } = await api.patch<Product>(`/api/admin/products/${id}`, payload);
  return data;
}

export async function deleteAdminProduct(id: number): Promise<void> {
  await api.delete(`/api/admin/products/${id}`);
}

export async function fetchAdminOrders(
  params: { status?: string; page?: number } = {}
): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>("/api/admin/orders", {
    params,
  });
  return data;
}

export async function updateAdminOrder(
  id: number,
  payload: { status?: string; paymentStatus?: string }
): Promise<Order> {
  const { data } = await api.patch<Order>(`/api/admin/orders/${id}`, payload);
  return data;
}

export async function fetchAdminCustomers(
  params: { page?: number } = {}
): Promise<Paginated<User>> {
  const { data } = await api.get<Paginated<User>>("/api/admin/customers", {
    params,
  });
  return data;
}

export async function fetchAdminCoupons(): Promise<Coupon[]> {
  const { data } = await api.get<Coupon[]>("/api/admin/coupons");
  return data;
}

export async function createAdminCoupon(payload: {
  code: string;
  amount: number;
  discountType: string;
  minSubtotal?: number;
  description?: string;
}): Promise<Coupon> {
  const { data } = await api.post<Coupon>("/api/admin/coupons", payload);
  return data;
}

export async function deleteAdminCoupon(id: number): Promise<void> {
  await api.delete(`/api/admin/coupons/${id}`);
}

// ---------------------------------------------------------------------------
// Hero Banners
// ---------------------------------------------------------------------------
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const { data } = await api.get<HeroBanner[]>("/api/hero-banners");
  return data;
}

export async function fetchAdminHeroBanners(): Promise<HeroBanner[]> {
  const { data } = await api.get<HeroBanner[]>("/api/admin/hero-banners");
  return data;
}

export interface HeroBannerInput {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  desktopImage?: string | null;
  mobileImage?: string | null;
  primaryText?: string | null;
  primaryUrl?: string | null;
  secondaryText?: string | null;
  secondaryUrl?: string | null;
  layout?: string;
  overlayOpacity?: number;
  animation?: string;
  displayOrder?: number;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export async function createHeroBanner(payload: HeroBannerInput): Promise<HeroBanner> {
  const { data } = await api.post<HeroBanner>("/api/admin/hero-banners", payload);
  return data;
}

export async function updateHeroBanner(
  id: number,
  payload: Partial<HeroBannerInput>
): Promise<HeroBanner> {
  const { data } = await api.patch<HeroBanner>(
    `/api/admin/hero-banners/${id}`,
    payload
  );
  return data;
}

export async function deleteHeroBanner(id: number): Promise<void> {
  await api.delete(`/api/admin/hero-banners/${id}`);
}

export async function duplicateHeroBanner(id: number): Promise<HeroBanner> {
  const { data } = await api.post<HeroBanner>(
    `/api/admin/hero-banners/${id}/duplicate`
  );
  return data;
}

export async function reorderHeroBanners(
  order: { id: number; displayOrder: number }[]
): Promise<void> {
  await api.patch("/api/admin/hero-banners/reorder", { order });
}
