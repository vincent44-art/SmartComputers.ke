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

export interface CartLine {
  id: number;
  productId: number;
  quantity: number;
  product: Product | null;
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
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string | null;
  itemCount: number;
  items?: OrderItem[];
  email?: string;
  shippingAddress?: Record<string, string>;
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

export interface AdminAnalytics {
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  revenueSeries: { date: string; revenue: number }[];
  lowStock: Product[];
  recentOrders: Order[];
}
