import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import ProductCard from '../components/ProductCard';

import * as productsApi from '../api/products';
import { useCartStore } from '../store/useCartStore';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const addToCart = useCartStore((state) => state.addToCart);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getProductBySlug(slug);
        if (response.success) {
          const prodData = response.data.product; // Corrected data path
          setProduct(prodData);
          if (prodData.product_variants && prodData.product_variants.length > 0) {
            setSelectedVariant(prodData.product_variants[0]);
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

  // Reset quantity when the selected variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  if (loading) return <div className="container py-40 text-center">Loading product...</div>;
  if (error || !product) return <div className="container py-40 text-center">{error || 'Product not found'}</div>;

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/shop"><ArrowLeft size={16} /> Back to Shop</Link>
          <span>/</span>
          <span>{product.category?.name}</span>
          <span>/</span>
          <span className="active">{product.name}</span>
        </div>

        <div className="product-main">
          <div className="product-gallery">
            <div className="main-image-container">
              <img 
                src={product.images?.find(img => img && img.trim() !== '') || 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=80&w=800'} 
                alt={product.name} 
                className="main-product-img"
              />
            </div>
            {product.images && product.images.filter(img => img && img.trim() !== '').length > 1 && (
              <div className="thumbnails-grid">
                {product.images.filter(img => img && img.trim() !== '').map((img, index) => (
                  <div key={index} className={`thumbnail-item ${index === 0 ? 'active' : ''}`}>
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-info-panel">
            <div className="product-header">
              <span className="category-label">{product.category?.name}</span>
              <h1 className="product-title">{product.name}</h1>
              
              <div className="rating-container">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.floor(product.avg_rating || 5) ? "var(--accent)" : "none"} 
                      color="var(--accent)" 
                    />
                  ))}
                </div>
                <span className="rating-text">
                  {product.avg_rating || 5.0} 
                  <span className="review-count">({product.review_count || 0} reviews)</span>
                </span>
              </div>
            </div>

            <div className="product-pricing">
              <div className="price-tag">
                <span className="currency">PKR</span>
                <span className="amount">{Number(selectedVariant?.price || product.base_price || 0).toLocaleString()}</span>
              </div>
              {selectedVariant && (
                <Badge variant="info" className="weight-badge">{selectedVariant.label}</Badge>
              )}
            </div>

            <div className="stock-info">
              {((selectedVariant ? selectedVariant.stock : product.stock) > 0) ? (
                <div className="stock-status in-stock">
                  <ShieldCheck size={16} />
                  <span>{selectedVariant ? selectedVariant.stock : product.stock} in stock</span>
                </div>
              ) : (
                <div className="stock-status out-of-stock">
                  <Badge variant="error">Out of Stock</Badge>
                </div>
              )}
            </div>

            {product.product_variants && product.product_variants.length > 0 && (
              <div className="variants-container">
                <h3 className="section-subtitle">Select Option</h3>
                <div className="variants-grid">
                  {product.product_variants.map(variant => {
                    const isActive = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        className={`variant-card ${isActive ? 'active' : ''} ${variant.stock <= 0 ? 'disabled' : ''}`}
                        onClick={() => variant.stock > 0 && setSelectedVariant(variant)}
                        disabled={variant.stock <= 0}
                      >
                        <span className="variant-label">{variant.label}</span>
                        <span className="variant-price">PKR {Number(variant.price).toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="actions-container">
              <div className="quantity-selector">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0}
                >
                  <Minus size={16} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(prev => {
                    const max = selectedVariant ? selectedVariant.stock : product.stock;
                    return prev < max ? prev + 1 : prev;
                  })}
                  disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0}
                >
                  <Plus size={16} />
                </button>
              </div>

              <Button
                variant="primary"
                className="add-to-cart-btn"
                  onClick={() => { addToCart(product, quantity, selectedVariant); setIsCartOpen(true); }}
                disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0}
              >
                <ShoppingCart size={20} className="mr-2" />
                {(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>

            <div className="trust-badges">
              <div className="trust-item">
                <Truck size={18} />
                <span>Free Delivery over PKR 2,000</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={18} />
                <span>100% Organic & Quality Tested</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tabs-section">
          <div className="tab-headers">
            <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>Description</button>
            <button className={activeTab === 'nutrition' ? 'active' : ''} onClick={() => setActiveTab('nutrition')}>Nutrition Info</button>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-pane fade-in">
                <p>{product.description}</p>
              </div>
            )}
            {activeTab === 'nutrition' && product.nutrition && (
              <div className="tab-pane fade-in">
                <table className="nutrition-table">
                  <tbody>
                    {Object.entries(product.nutrition).map(([key, val]) => (
                      <tr key={key}>
                        <td className="nutrient">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                        <td className="value">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-section">
            <h2>Related Products</h2>
            <div className="related-grid">
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
