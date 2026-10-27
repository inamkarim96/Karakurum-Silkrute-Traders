import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';

const FREE_SHIPPING_THRESHOLD = 2000;

const CartDrawer = () => {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[130] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                Shopping Cart
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            {cart.length > 0 && (
              <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 mb-1.5">
                  {amountToFreeShipping === 0 ? (
                    <>
                      <CheckCircle size={15} className="text-emerald-600" />
                      <span>You unlocked <strong>FREE Express Delivery</strong>!</span>
                    </>
                  ) : (
                    <>
                      <Truck size={15} className="text-emerald-600" />
                      <span>
                        Add <strong>PKR {amountToFreeShipping.toLocaleString()}</strong> more for <strong>FREE Delivery</strong>
                      </span>
                    </>
                  )}
                </div>
                <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20 text-emerald-800" />
                  <p className="text-base font-medium mb-4">Your cart is empty.</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={`${item.id}-${item.selectedWeight?.label || item.selectedWeight || 'default'}`}
                      className="flex gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl"
                    >
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
                        <img 
                          src={item.image_url || item.images?.[0] || 'https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=300'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.selectedWeight?.label || (typeof item.selectedWeight === 'string' ? item.selectedWeight : 'Standard')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-200">
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="font-extrabold text-sm text-slate-900">
                            PKR {((item.price || item.base_price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedWeight)}
                        className="text-slate-400 hover:text-rose-500 transition-colors h-fit p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal & Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-slate-900">PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-5">
                  <span>Shipping:</span>
                  <span>{subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : 'Calculated at checkout (PKR 150)'}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-700/25 active:scale-[0.99]"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
