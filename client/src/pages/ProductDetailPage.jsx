import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Package, 
  CheckCircle2, 
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { Button, Badge } from '../components/ui';
import ProductCard from '../components/ProductCard';
import * as productsApi from '../api/products';
import * as reviewsApi from '../api/reviews';
import { getSettings } from '../api/site';
import { useCartStore } from '../store/useCartStore';
import { useAuth } from '../context/AuthContext';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [settings, setSettings] = useState(null);
  
  // Reviews state
  const [reviewsData, setReviewsData] = useState({ reviews: [], avg_rating: '5.0', total_count: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSettings().then(res => setSettings(res.data?.settings || null)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setActiveImageIndex(0);
        const response = await productsApi.getProductBySlug(slug);
        if (response.success) {
          const prodData = response.data.product;
          setProduct(prodData);
          if (prodData.product_variants && prodData.product_variants.length > 0) {
            setSelectedVariant(prodData.product_variants[0]);
          }

          // Fetch reviews
          if (prodData.id) {
            fetchReviews(prodData.id);
          }

          // Fetch related products
          const relatedRes = await productsApi.getProducts({
            category: prodData.category?.slug,
            limit: 5
          });
          if (relatedRes.success) {
            setRelatedProducts(relatedRes.data.products?.filter(p => p.id !== prodData.id).slice(0, 4) || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchReviews = async (productId) => {
    try {
      setLoadingReviews(true);
      const res = await reviewsApi.getProductReviews(productId);
      if (res.success && res.data) {
        setReviewsData({
          reviews: res.data.reviews || [],
          avg_rating: res.data.avg_rating || '5.0',
          total_count: res.data.total_count || 0
        });
      }
    } catch (err) {
      console.warn("Could not load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to write a review.");
      return;
    }
    if (!reviewBody.trim()) {
      toast.error("Please write a review comment.");
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await reviewsApi.createReview({
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim()
      });

      if (res.success) {
        toast.success("Thank you! Your review has been submitted.");
        setReviewTitle('');
        setReviewBody('');
        fetchReviews(product.id);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to submit review. Only verified purchasers can review.";
      toast.error(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Reset quantity when the selected variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  if (loading) {
    return (
      <div className="container py-32 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading Karakurum goods...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-32 text-center">
        <h2 className="text-2xl font-bold text-slate-800">{error || 'Product not found'}</h2>
        <Link to="/shop" className="mt-4 inline-flex items-center gap-2 text-emerald-600 font-medium">
          <ArrowLeft size={16} /> Return to Store
        </Link>
      </div>
    );
  }

  const validImages = product.images?.filter(img => img && img.trim() !== '') || [];
  const displayImages = validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=900'];
  const currentImage = displayImages[activeImageIndex] || displayImages[0];

  const currentPrice = Number(selectedVariant?.price || product.base_price || 0);
  const wholesalePrice = Number(selectedVariant?.wholesale_price || product.wholesale_price || 0);
  const minWholesaleQty = product.min_wholesale_qty || 10;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  // WhatsApp prefilled message
  const whatsappNumber = (settings?.whatsapp || settings?.phone || '923000000000').replace(/\D/g, '');
  const inquiryText = encodeURIComponent(
    `Hello Karakurum Silkrute Traders!\nI am inquiring about:\n*${product.name}*\nVariant: ${selectedVariant?.label || 'Standard'}\nPrice: PKR ${currentPrice.toLocaleString()}\nPage: ${window.location.href}\n\nCould you please provide stock status or bulk/cargo wholesale pricing?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${inquiryText}`;

  return (
    <div className="product-detail-page py-8">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumbs mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/shop" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
            <ArrowLeft size={15} /> Shop
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-emerald-700">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Showcase */}
        <div className="product-main grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Gallery Column (7 cols on large screens) */}
          <div className="product-gallery lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImage}
                  src={currentImage} 
                  alt={product.name} 
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.4 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                />
              </AnimatePresence>

              {/* Image Counter Badge */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium">
                  {activeImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {displayImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImageIndex === index 
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105' 
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Purchase Column (5 cols on large screens) */}
          <div className="product-info-panel lg:col-span-5 flex flex-col">
            <div className="product-header pb-4 border-b border-slate-100">
              {product.category && (
                <span className="inline-block text-xs font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
              
              {/* Rating & reviews header */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={17} 
                      fill={i < Math.floor(Number(reviewsData.avg_rating || 5)) ? "currentColor" : "none"} 
                      className="text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {reviewsData.avg_rating}
                </span>
                <span className="text-sm text-slate-400">
                  ({reviewsData.total_count} customer reviews)
                </span>
              </div>
            </div>

            {/* Retail Pricing */}
            <div className="py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-slate-500 uppercase">Retail Price</span>
                <div className="text-3xl font-extrabold text-slate-900">
                  PKR {currentPrice.toLocaleString()}
                </div>
                {selectedVariant && (
                  <Badge variant="info" className="ml-auto font-medium">
                    {selectedVariant.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Wholesale Callout Banner (if available) */}
            {wholesalePrice > 0 && (
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Package className="w-6 h-6 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                      Wholesale / Bulk Trading Rate Available
                      <span className="bg-amber-200 text-amber-800 text-[10px] uppercase font-black px-2 py-0.5 rounded">B2B</span>
                    </div>
                    <div className="text-sm text-amber-800 mt-1">
                      Buy <strong className="font-bold">{minWholesaleQty}+ pieces</strong> at only <strong className="font-bold text-emerald-800">PKR {wholesalePrice.toLocaleString()} / unit</strong>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Custom carton and cargo dispatch available directly from Danyore trading hub.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock status */}
            <div className="mb-4">
              {currentStock > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                  <ShieldCheck size={16} />
                  <span>{currentStock} units in stock</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium">
                  <Badge variant="error">Out of Stock</Badge>
                </div>
              )}
            </div>

            {/* Variants options (e.g. Size, Weight, Color) */}
            {product.product_variants && product.product_variants.length > 0 && (
              <div className="variants-container mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Specification / Variant:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.product_variants.map(variant => {
                    const isActive = selectedVariant?.id === variant.id;
                    const isOutOfStock = variant.stock <= 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                        disabled={isOutOfStock}
                        className={`text-left p-3 rounded-xl border text-sm font-medium transition-all ${
                          isActive 
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950 font-bold' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : ''}`}
                      >
                        <div className="truncate">{variant.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">PKR {Number(variant.price).toLocaleString()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-6">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm h-12 w-36 flex-shrink-0 justify-between px-2">
                <button 
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={currentStock <= 0}
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold text-slate-900 w-8 text-center">{quantity}</span>
                <button 
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  onClick={() => setQuantity(prev => (prev < currentStock ? prev + 1 : prev))}
                  disabled={currentStock <= 0}
                >
                  <Plus size={16} />
                </button>
              </div>

              <Button
                variant="primary"
                className="flex-1 h-12 rounded-xl text-base font-bold shadow-md shadow-emerald-700/20"
                onClick={() => { 
                  addToCart(product, quantity, selectedVariant); 
                  setIsCartOpen(true); 
                }}
                disabled={currentStock <= 0}
              >
                <ShoppingCart size={19} className="mr-2" />
                {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>

            {/* Direct WhatsApp Inquiry for B2B or Quick Questions */}
            <div className="mb-6">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors font-semibold text-sm shadow-sm"
              >
                <FaWhatsapp className="w-5 h-5 text-emerald-600" />
                Inquire or Order via WhatsApp (Wholesale / Retail)
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-emerald-600 flex-shrink-0" />
                <span>Express Cargo across Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                <span>Quality Inspected Goods</span>
              </div>
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-600 flex-shrink-0" />
                <span>Bulk Packaging & Cartons</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <span>Danyore Sourcing Hub Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Detailed Sections */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button 
              className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'description' 
                  ? 'border-emerald-600 text-emerald-800 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description & Details
            </button>
            <button 
              className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'specifications' 
                  ? 'border-emerald-600 text-emerald-800 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications & Origin
            </button>
            <button 
              className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'reviews' 
                  ? 'border-emerald-600 text-emerald-800 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Customer Reviews ({reviewsData.total_count})
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                <p className="text-base">{product.description || 'Premium sourced item from Karakurum Silkrute Traders, tailored for durability, style, and superior texture.'}</p>
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-2">Why buy from Karakurum Silkrute Traders?</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                    <li>Direct access to Silk Route supply chains with vetted quality check in Danyore.</li>
                    <li>Competitive wholesale pricing for shopkeepers, hotels, and retail buyers.</li>
                    <li>Fast logistics coordination across all major hubs in Pakistan.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-sm">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-600 bg-slate-50 w-1/3">Category</td>
                      <td className="py-3 px-4 text-slate-800">{product.category?.name || 'General Trading Goods'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-600 bg-slate-50">Sourcing & Origin</td>
                      <td className="py-3 px-4 text-slate-800">Silk Route & China Trade Corridor via Danyore, Gilgit-Baltistan</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-600 bg-slate-50">Active Variant</td>
                      <td className="py-3 px-4 text-slate-800">{selectedVariant?.label || 'Standard Edition'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-600 bg-slate-50">Minimum Wholesale Lot</td>
                      <td className="py-3 px-4 text-slate-800">{product.min_wholesale_qty || 10} Units</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-600 bg-slate-50">Care & Handling</td>
                      <td className="py-3 px-4 text-slate-800">Keep in dry storage. Gentle wash or dry clean recommended for fine blankets and textiles.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Reviews Header & Score */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Verified Customer Reviews</h3>
                    <p className="text-sm text-slate-500">Authentic feedback from verified customers</p>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <div className="text-2xl font-black text-amber-900">{reviewsData.avg_rating}</div>
                    <div>
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={15} fill={i < Math.floor(Number(reviewsData.avg_rating || 5)) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <div className="text-xs text-amber-800">{reviewsData.total_count} ratings</div>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {loadingReviews ? (
                  <p className="text-slate-500 py-6">Loading reviews...</p>
                ) : reviewsData.reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No customer reviews yet. Be the first verified buyer to leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900">{rev.user_name || 'Customer'}</span>
                          <span className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-amber-400 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                        {rev.title && <h5 className="font-semibold text-slate-800 text-sm mb-1">{rev.title}</h5>}
                        <p className="text-sm text-slate-600">{rev.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a Review Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Write a Review</h4>
                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Rating:
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="text-amber-400 p-1 hover:scale-110 transition-transform"
                            >
                              <Star size={24} fill={star <= reviewRating ? "currentColor" : "none"} />
                            </button>
                          ))}
                          <span className="text-sm font-semibold text-slate-700 ml-2">{reviewRating} Stars</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Review Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="e.g. Excellent wool quality, fast delivery!"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Your Feedback
                        </label>
                        <textarea
                          rows={4}
                          value={reviewBody}
                          onChange={(e) => setReviewBody(e.target.value)}
                          placeholder="Describe your experience with the fabric, finish, delivery, or packaging..."
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submittingReview}
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                      Please <Link to="/login" className="text-emerald-700 font-bold hover:underline">sign in</Link> to leave a review for purchased items.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-section mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
                <p className="text-sm text-slate-500">More sourced goods in {product.category?.name || 'this category'}</p>
              </div>
              <Link to="/shop" className="text-emerald-700 font-bold text-sm hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
