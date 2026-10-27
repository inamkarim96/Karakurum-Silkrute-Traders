import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCcw, 
  Boxes, 
  BriefcaseBusiness, 
  Plane, 
  CheckCircle2, 
  PhoneCall, 
  Sparkles,
  Star,
  Quote
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import ProductCard from '../components/ProductCard';

import { getSettings, getServices, getTestimonials } from '../api/site';
import * as productsApi from '../api/products';

const iconMap = {
  trade: BriefcaseBusiness,
  sourcing: Boxes,
  cargo: Plane,
  customs: ShieldCheck
};

const LandingPage = () => {
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    getSettings().then((res) => setSettings(res.data?.settings || null)).catch(() => {});
    getServices().then((res) => setServices(res.data?.services || [])).catch(() => {});
    getTestimonials().then((res) => setTestimonials(res.data?.testimonials || [])).catch(() => {});
    
    // Fetch categories dynamically from database
    productsApi.getCategories()
      .then((res) => {
        if (res.success && res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});
    
    // Fetch featured products
    productsApi.getFeaturedProducts()
      .then((res) => {
        if (res.success && res.data?.products?.length > 0) {
          setFeaturedProducts(res.data.products.slice(0, 4));
        } else {
          // Fallback to latest products
          return productsApi.getProducts({ limit: 4 }).then((fallbackRes) => {
            if (fallbackRes.success) {
              setFeaturedProducts(fallbackRes.data.products || []);
            }
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const rawPhone = settings?.whatsapp || settings?.phone || '923000000000';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const wholesaleInquiryUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hello Karakurum Silkrute Traders, I am interested in wholesale trading rates and bulk cargo dispatch.'
  )}`;

  const features = [
    { 
      icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />, 
      title: 'Silk Route Quality Assured', 
      desc: 'Each carton and item is inspected for fabric durability and craftsmanship before leaving Danyore.' 
    },
    { 
      icon: <Truck className="w-8 h-8 text-emerald-600" />, 
      title: 'Nationwide Express Cargo', 
      desc: 'Reliable distribution across Pakistan with tracking and customs clearance support.' 
    },
    { 
      icon: <RefreshCcw className="w-8 h-8 text-emerald-600" />, 
      title: 'Wholesale & Retail Pricing', 
      desc: 'Tiered wholesale discounts for shopkeepers, hotels, and retail buyers directly from the source.' 
    },
  ];

  return (
    <div className="landing-page overflow-hidden">
      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center text-white bg-slate-900 px-4 py-20"
        style={settings?.hero_image_url ? {
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('${settings.hero_image_url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 44, 34, 0.9)), url('https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs md:text-sm font-semibold tracking-wide uppercase mb-6 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-emerald-400" />
            Direct Trade from Danyore, Gilgit-Baltistan
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Quality Goods <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Moved with Confidence
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-2xl text-slate-200 max-w-3xl mx-auto mb-10 font-normal leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {settings?.tagline || 'Wholesale, retail, sourcing, cargo & customs support — direct from the Karakoram Silk Route trade corridor.'}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button as={Link} to="/shop" variant="primary" size="lg" className="w-full sm:w-auto text-base px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/40">
              Shop Collection <ArrowRight size={18} className="ml-2" />
            </Button>
            <a
              href={wholesaleInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md transition-all duration-200 text-base"
            >
              <FaWhatsapp className="w-5 h-5 text-emerald-400" />
              Wholesale & Cargo Quote
            </a>
          </motion.div>

          {/* Highlights Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/15 text-xs sm:text-sm text-slate-300"
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Bulk Wholesale Lots
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Danyore Cargo Hub
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Customs Clearance
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Safe Online Payment
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Three Pillars / Value Proposition ────────────────────────────── */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="p-3 w-fit rounded-xl bg-emerald-50 mb-5">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Visual Category Explorer ────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-emerald-700 mb-2">Curated Inventory</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Explore by Category</h2>
            </div>
            <Link to="/shop" className="mt-4 md:mt-0 inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800">
              Browse all items <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id || cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900 flex items-center justify-center">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 -z-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
                    <Boxes size={32} className="text-emerald-400 mb-2 opacity-80" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">{cat.name}</span>
                  </div>
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
                    {cat._count?.products !== undefined ? `${cat._count.products} Items` : 'Collection'}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                      Sourced goods and collections available for retail and wholesale orders.
                    </p>
                  </div>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 group-hover:translate-x-1 transition-transform"
                  >
                    View Products <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Featured Products Showcase ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-emerald-700 mb-2">Selected Highlights</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Featured Blankets & Goods</h2>
            </div>
            <Link to="/shop" className="mt-4 md:mt-0 inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800">
              View full shop <ArrowRight size={16} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="py-20 text-center text-slate-500">Loading catalog...</div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Explore all available items in the shop catalog.</p>
              <Button as={Link} to="/shop" variant="primary" className="mt-4">
                Go to Shop
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Wholesale & B2B Trade Spotlight ───────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                B2B Bulk Supply & Customs
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                Direct Trading Hub from <br />
                <span className="text-emerald-400">Danyore & The Silk Route</span>
              </h2>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8">
                Operating out of Fida Jan Plaza, Baig Market, Danyore, we act as the primary bridge between Khunjerab import routes and Pakistani commercial markets. We provide wholesale cartons of luxury blankets, custom sourcing, and express cargo coordination.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="font-bold text-white text-base mb-1">Wholesale Pricing</h4>
                  <p className="text-slate-400 text-xs">Direct container and carton rates for volume retailers.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="font-bold text-white text-base mb-1">Cargo & Customs</h4>
                  <p className="text-slate-400 text-xs">Smooth handling of port-of-entry formalities and delivery.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href={wholesaleInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/25"
                >
                  <FaWhatsapp className="w-5 h-5" /> Inquire for Bulk Cartons
                </a>
                <Button as={Link} to="/services" variant="admin-outline" className="border-white/40 text-white hover:bg-white/10">
                  Explore Trade Services
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-8 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-2xl space-y-6">
                <h3 className="text-2xl font-bold text-white">Commercial Trade Services</h3>
                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.slice(0, 4).map((s) => {
                      const Icon = iconMap[s.icon?.toLowerCase()] || BriefcaseBusiness;
                      return (
                        <div key={s.id} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                            <Icon size={20} />
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-sm">{s.title}</h5>
                            <p className="text-xs text-slate-300 mt-0.5">{s.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span>Bulk wholesale supply for retail shops and hotels</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span>Direct supplier coordination across the border</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span>Cargo and freight forwarding nationwide</span>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                  <span>Warehouse Hub: Danyore</span>
                  <Link to="/contact" className="text-emerald-400 font-bold hover:underline">
                    Contact Us &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Testimonials Section (Managed completely from Admin Panel) ── */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-widest font-black text-emerald-700 mb-2">Verified Feedback</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Trusted by Retailers & Homes</h2>
              <p className="text-slate-500 mt-3 text-sm md:text-base">
                Real feedback from businesses and buyers across Pakistan working with Karakurum Silkrute Traders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {[...Array(Number(t.rating) || 5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <Quote size={28} className="text-emerald-600/20 mb-2" />
                    <p className="text-slate-700 text-sm leading-relaxed italic mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-emerald-700 font-medium">{t.role || 'Verified Buyer'}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Call to Action Banner ────────────────────────────────────────── */}
      <section className="py-16 bg-emerald-800 text-white text-center px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Source Quality Goods?</h2>
          <p className="text-emerald-100 text-base md:text-lg mb-8 leading-relaxed">
            Whether you want a single luxury blanket for home or a 50-carton consignment for your retail showroom, we deliver with speed and care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button as={Link} to="/shop" variant="secondary" size="lg" className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-emerald-50">
              Start Shopping Online
            </Button>
            <Button as={Link} to="/contact" variant="admin-outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
              Talk to Our Danyore Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
