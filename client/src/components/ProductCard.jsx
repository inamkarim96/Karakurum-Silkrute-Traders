import React from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getProductBySlug } from '../api/products';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=60&w=600';

const ProductCard = ({ product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  const handlePrefetch = () => {
    getProductBySlug(product.slug).catch(() => { });
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.product_variants?.[0];
    const defaultVariantLabel = defaultVariant?.label || 'Standard';
    addToCart(product, 1, defaultVariantLabel);
    setIsCartOpen(true);
    toast.success(`${product.name} added to cart!`);
  };

  const imageUrl = getOptimizedImageUrl(product.images?.[0], { width: 600, height: 600, crop: 'fill' }) || PLACEHOLDER;

  return (
    <motion.div
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-premium-hover transition-all duration-300"
      onMouseEnter={handlePrefetch}
      whileHover={{ y: -8 }}
      layout
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <motion.img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </Link>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.is_featured && (
            <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-sm">
              Featured
            </span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
              Low Stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
              Out of Stock
            </span>
          )}
        </div>
        
        {/* Quick Actions Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <Link 
            to={`/product/${product.slug}`} 
            className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          >
            <Eye size={18} />
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/shop?category=${product.category?.slug}`} className="text-xs text-text-muted font-medium mb-1 hover:text-primary transition-colors">
          {product.category?.name || 'Uncategorized'}
        </Link>
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-lg font-bold text-text-main line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.floor(product.avg_rating || 5) ? "var(--accent)" : "none"}
              color="var(--accent)"
            />
          ))}
          <span className="text-xs text-text-muted ml-1">({product.review_count || 0})</span>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            PKR {Number(product.base_price).toLocaleString()}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-primary"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ProductCard);
