const mongoose = require("mongoose");
const { Schema } = mongoose;

// ── 1. Users ────────────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    phone: { type: String },
    is_active: { type: Boolean, default: true },
    email_verified: { type: Boolean, default: false },
    failed_login_attempts: { type: Number, default: 0 },
    locked_until: { type: Date },
    fcm_token: { type: String },
    auth_provider: { type: String, enum: ["local", "google"], default: "local" },
    google_id: { type: String, unique: true, sparse: true }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 2. Addresses ────────────────────────────────────────────────────────────
const addressSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    full_name: { type: String },
    phone: { type: String },
    address_line: { type: String },
    city: { type: String },
    province: { type: String },
    postal_code: { type: String },
    country: { type: String, default: "PK" },
    is_default: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 3. Categories ───────────────────────────────────────────────────────────
const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 4. Products & Variants ──────────────────────────────────────────────────
const variantSchema = new Schema({
  label: { type: String, required: true },
  attribute_name: { type: String },
  attribute_value: { type: String },
  price: { type: Number, required: true },
  wholesale_price: { type: Number },
  stock: { type: Number, default: 0 },
  sort_order: { type: Number, default: 0 }
});

const productSchema = new Schema(
  {
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    base_price: { type: Number, required: true },
    wholesale_price: { type: Number },
    min_wholesale_qty: { type: Number },
    stock: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    is_featured: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    product_variants: [variantSchema]
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 5. Cart Items ───────────────────────────────────────────────────────────
const cartItemSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
cartItemSchema.index({ user_id: 1, variant_id: 1 }, { unique: true });

// ── 6. Orders ───────────────────────────────────────────────────────────────
const orderItemSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variant_id: { type: String },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const orderHistorySchema = new Schema({
  status_from: { type: String },
  status_to: { type: String, required: true },
  changed_by: { type: Schema.Types.ObjectId, ref: "User" },
  notes: { type: String },
  created_at: { type: Date, default: Date.now }
});

const orderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    subtotal: { type: Number, required: true },
    shipping_fee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shipping_address: { type: Schema.Types.Mixed, required: true },
    coupon_code: { type: String },
    tracking_number: { type: String },
    courier: { type: String },
    notes: { type: String },
    admin_notes: { type: String },
    order_items: [orderItemSchema],
    order_history: [orderHistorySchema]
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 7. Payments ─────────────────────────────────────────────────────────────
const paymentSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    gateway: { type: String, enum: ["jazzcash", "easypaisa", "stripe", "cod"], required: true },
    transaction_id: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    gateway_resp: { type: Schema.Types.Mixed },
    paid_at: { type: Date }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 8. Reviews ──────────────────────────────────────────────────────────────
const reviewSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    body: { type: String }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// ── 9. Coupons ──────────────────────────────────────────────────────────────
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    min_order_amount: { type: Number, default: 0 },
    max_uses: { type: Number },
    used_count: { type: Number, default: 0 },
    expires_at: { type: Date },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 10. Site Settings (Singleton) ───────────────────────────────────────────
const siteSettingSchema = new Schema(
  {
    company_name: { type: String, default: "Karakurum Silkrute Traders" },
    tagline: { type: String },
    logo_url: { type: String },
    address_line: { type: String },
    city: { type: String },
    email: { type: String },
    notification_email: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    facebook_url: { type: String },
    instagram_url: { type: String },
    website_url: { type: String },
    map_embed_url: { type: String },
    footer_text: { type: String },
    hero_image_url: { type: String },
    about_hero_image_url: { type: String },
    about_mission_image_url: { type: String },
    contact_hero_image_url: { type: String }
  },
  { timestamps: { createdAt: false, updatedAt: "updated_at" } }
);

// ── 11. Services ────────────────────────────────────────────────────────────
const serviceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 12. Team Members ────────────────────────────────────────────────────────
const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    photo_url: { type: String },
    bio: { type: String },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 13. Testimonials ────────────────────────────────────────────────────────
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, default: 5 },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ── 14. Notifications ───────────────────────────────────────────────────────
const notificationSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String },
    data: { type: Schema.Types.Mixed },
    is_read: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// Helper to format documents so _id maps to id
const transformDoc = (schema) => {
  schema.set("toJSON", {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
  schema.set("toObject", {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
};

[
  userSchema,
  addressSchema,
  categorySchema,
  productSchema,
  cartItemSchema,
  orderSchema,
  paymentSchema,
  reviewSchema,
  couponSchema,
  siteSettingSchema,
  serviceSchema,
  teamMemberSchema,
  testimonialSchema,
  notificationSchema
].forEach(transformDoc);

const models = {
  User: mongoose.models.User || mongoose.model("User", userSchema, "users"),
  Address: mongoose.models.Address || mongoose.model("Address", addressSchema, "addresses"),
  Category: mongoose.models.Category || mongoose.model("Category", categorySchema, "categories"),
  Product: mongoose.models.Product || mongoose.model("Product", productSchema, "products"),
  CartItem: mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema, "cart_items"),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema, "orders"),
  Payment: mongoose.models.Payment || mongoose.model("Payment", paymentSchema, "payments"),
  Review: mongoose.models.Review || mongoose.model("Review", reviewSchema, "reviews"),
  Coupon: mongoose.models.Coupon || mongoose.model("Coupon", couponSchema, "coupons"),
  SiteSetting: mongoose.models.SiteSetting || mongoose.model("SiteSetting", siteSettingSchema, "site_settings"),
  Service: mongoose.models.Service || mongoose.model("Service", serviceSchema, "services"),
  TeamMember: mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema, "team_members"),
  Testimonial: mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema, "testimonials"),
  Notification: mongoose.models.Notification || mongoose.model("Notification", notificationSchema, "notifications")
};

module.exports = models;
