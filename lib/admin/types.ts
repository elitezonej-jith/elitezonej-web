// Shared TS types for the admin panel — mirror schema.sql.

export type Role = "owner" | "staff";

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  created_at: string;
  last_login_at: string | null;
};

export type Session = {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
  ip: string | null;
  ua: string | null;
};

export type ProductKind = "tailored" | "fabric";
export type ProductStatus = "active" | "draft" | "archived";

export type ProductRow = {
  slug: string;
  name: string;
  cat: string;
  cat_link: "Men" | "Women" | "Fabrics";
  price: number;
  sale_price: number | null;
  line: string;
  sizes_json: string;
  features_json: string;
  spec_json: string;
  note: string;
  fit: string;
  fabric: string;
  occasion: string;
  badge: string | null;
  gender: "men" | "women" | "unisex";
  category: string;
  sub: string | null;
  kind: ProductKind;
  status: ProductStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = Omit<
  ProductRow,
  "sizes_json" | "features_json" | "spec_json"
> & {
  sizes: string[];
  features: string[];
  spec: [string, string][];
};

export type InventoryRow = {
  product_slug: string;
  size: string;
  stock: number;
  oos_flag: number;
};

export type FabricMetaRow = {
  product_slug: string;
  width_inches: number;
  gsm: number;
  composition: string;
  care: string;
  origin: string;
  stock_meters_total: number;
};

export type FabricColourRow = {
  id: number;
  product_slug: string;
  name: string;
  hex: string;
  stock_meters: number;
  image_dir: string | null;
  sort_order: number;
};

export type Customer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  city: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "in_atelier"
  | "shipped"
  | "fulfilled"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Order = {
  id: string;
  customer_id: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // schema-v3 commerce columns
  discount: number;
  shipping: number;
  promo_code: string | null;
  payment_status: PaymentStatus;
  email: string;
  phone: string;
  ship_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  ship_country: string;
};

export type Payment = {
  id: string;
  order_id: string;
  provider: "razorpay" | "offline";
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriber = {
  id: number;
  email: string;
  source: string;
  status: "subscribed" | "unsubscribed";
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: string;
  product_slug: string;
  qty: number;
  unit_price: number;
  size: string | null;
  colour: string | null;
  is_fabric: number;
};

export type BookingStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "done"
  | "closed";

export type Booking = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  city: string;
  service: string;
  message: string | null;
  status: BookingStatus;
  source: string;
  assigned_to: number | null;
  created_at: string;
};

export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  gender: string | null;
  kind: string | null;
  sort_order: number;
};

export type PromoType = "percent" | "flat" | "free_ship";
export type PromoStatus = "active" | "scheduled" | "expired" | "disabled";

export type Promotion = {
  code: string;
  type: PromoType;
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  min_total: number;
  usage_limit: number | null;
  usage_count: number;
  status: PromoStatus;
  description: string | null;
  created_at: string;
};

export type HomeSection = {
  key: string;
  title: string;
  kicker: string | null;
  body: string | null;
  image_path: string | null;
  link_text: string | null;
  link_href: string | null;
  sort_order: number;
  enabled: number;
  extras_json: string | null;
};

export type MediaAsset = {
  path: string;
  alt: string | null;
  role: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  used_in_json: string | null;
};

export type Setting = { key: string; value: string };

export type AuditLog = {
  id: number;
  user_id: number | null;
  action: string;
  entity: string;
  entity_id: string | null;
  payload_json: string | null;
  created_at: string;
};
