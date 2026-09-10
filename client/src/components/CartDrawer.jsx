import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const navigate = useNavigate();

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
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                Your Cart
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg mb-4">Your cart is empty.</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary-light transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={`${item.id}-${item.selectedWeight?.label || item.selectedWeight}`}
                      className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        <img 
                          src={item.image_url || '/placeholder.png'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {item.selectedWeight?.label || item.selectedWeight || 'Default'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold text-primary">
                            Rs {((item.price || item.base_price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedWeight)}
                        className="text-gray-400 hover:text-red-500 transition-colors h-fit p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold">Rs {getSubtotal().toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-400 mb-6">Shipping and taxes calculated at checkout.</p>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-light transition-all shadow-premium hover:shadow-premium-hover active:scale-[0.98]"
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
