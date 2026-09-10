import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,

      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

      addToCart: (product, quantity = 1, weight = null) => {
        const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');

        set((state) => {
          const existingItem = state.cart.find(item =>
            item.id === product.id &&
            (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel)
          );

          if (existingItem) {
            return {
              cart: state.cart.map(item =>
                (item.id === product.id && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            };
          }

          const price = weight?.price || product.base_price;
          return {
            cart: [...state.cart, { ...product, quantity, selectedWeight: weight || weightLabel, price }]
          };
        });
      },

      removeFromCart: (productId, weight) => {
        const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');
        set((state) => ({
          cart: state.cart.filter(item =>
            !(item.id === productId && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
          )
        }));
      },

      updateQuantity: (productId, weight, quantity) => {
        if (quantity < 1) return;
        const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');
        set((state) => ({
          cart: state.cart.map(item =>
            (item.id === productId && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
              ? { ...item, quantity }
              : item
          )
        }));
      },

      clearCart: () => set({ cart: [] }),

      getTotalItems: () => get().cart.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () => get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    }),
    {
      name: 'karakurum-silkrute-traders-cart-storage',
    }
  )
);
