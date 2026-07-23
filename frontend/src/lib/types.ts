export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  isFeatured: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  parentId: number | null;
  isFeatured: boolean;
  children?: Category[];
}

export interface SpecsSummary {
  processor: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  graphics: string | null;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  position: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  condition: string;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt: string | null;
  brand: Brand | null;
  category: Category | null;
  thumbnail: string | null;
  specsSummary: SpecsSummary;
  // detail-only
  description?: string;
  warranty?: string;
  specs?: Record<string, string | null>;
  images?: ProductImage[];
  related?: Product[];
  reviews?: Review[];
}

export interface Review {
  id: number;
  productId: number;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  createdAt: string | null;
}

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface Facets {
  ram: string[];
  storage: string[];
  processor: string[];
  condition: string[];
  brands: Brand[];
  priceRange: { min: number; max: number };
}

export interface VariantAttributes {
  ram?: string;
  storage?: string;
  processor?: string;
  color?: string;
  [key: string]: string | undefined;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  stock: number;
  inStock: boolean;
  attributes: VariantAttributes;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CartLine {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product: Product | null;
  variantData: VariantAttributes;
  variantImage: string | null;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: string;
  loyaltyPoints: number;
  createdAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  locked: boolean;
  createdAt: string | null;
  approvedAt?: string | null;
  itemCount: number;
  items?: OrderItem[];
  email?: string;
  phone?: string;
  notes?: string;
  internalNotes?: string;
  shippingAddress?: Record<string, string>;
  billingAddress?: Record<string, string>;
  couponCode?: string | null;
  isOutsideNairobi?: boolean;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  thumbnail: string | null;
  lineTotal: number;
  currentStock?: number;
  inStock?: boolean;
  stockSufficient?: boolean;
}

export interface OrderReviewPayload {
  deliveryFee?: number;
  discount?: number;
  tax?: number;
  internalNotes?: string;
}

export interface CheckoutPayload {
  email: string;
  phone: string;
  customerName: string;
  items: { productId: number; quantity: number }[];
  shippingAddress: Record<string, string>;
  notes?: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  amount: number;
  minSubtotal: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogComment {
  id: number;
  author: string;
  body: string;
  createdAt: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  readingMinutes: number;
  category: BlogCategory | null;
  tags: BlogTag[];
  publishedAt: string | null;
  // detail-only
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  comments?: BlogComment[];
  related?: BlogPost[];
}

export interface RecommendationItem {
  product: Product;
  score: number;
  reason: string;
}

export interface RecommendationResponse {
  products: RecommendationItem[];
  fallback: boolean;
}

export interface HomePageData {
  categories: Category[];
  featured: Product[];
  bestSellers: Product[];
  flashSale: Product[];
  latest: Product[];
}

export interface AdminAnalytics {
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    pendingOrders: number;
    lowStock: number;
  };
  orderStatusCounts: Record<string, number>;
  revenueSeries7d: { date: string; revenue: number }[];
  revenueSeries30d: { date: string; revenue: number }[];
  revenueSeries12m: { date: string; revenue: number }[];
  ordersSeries7d: { date: string; orders: number }[];
  ordersSeries30d: { date: string; orders: number }[];
  ordersSeries12m: { date: string; orders: number }[];
  bestSellingCategories: {
    name: string;
    orderCount: number;
    revenue: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    count: number;
    revenue: number;
  }[];
  recentOrders: (Order & { customerName: string; customerEmail: string })[];
  recentCustomers: (User & { orderCount: number; totalSpent: number })[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  recentlyAddedProducts: Product[];
  heroBanners: HeroBanner[];
  storePerformance: {
    conversionRate: number;
    averageOrderValue: number;
    totalVisitors: number;
    returningCustomers: number;
  };
  activityFeed: {
    type: string;
    message: string;
    amount: number;
    timestamp: string | null;
  }[];
}

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string | null;
  badge: string | null;
  desktopImage: string | null;
  mobileImage: string | null;
  primaryText: string | null;
  primaryUrl: string | null;
  secondaryText: string | null;
  secondaryUrl: string | null;
  layout: "left" | "center" | "right";
  overlayOpacity: number;
  animation: "fade" | "slideLeft" | "slideRight" | "slideUp" | "zoom" | "none";
  displayOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
