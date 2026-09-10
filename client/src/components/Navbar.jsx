import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Leaf, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { getSettings } from '../api/site';
import * as productsApi from '../api/products';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const location = useLocation();
  const { user } = useAuth();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  useEffect(() => {
    getSettings().then((response) => setSettings(response.data?.settings || null)).catch(() => {});
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      productsApi.searchProducts(query)
        .then((response) => setSearchResults(response.data?.products || []))
        .catch(() => setSearchResults([]));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > 100 && latest > previous) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm"
      >
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Leaf className="w-6 h-6 text-success" />
            <span>{settings?.company_name || 'Karakurum Silkrute Traders'}</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="relative text-text-main font-medium group py-2"
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="underline"
                    className="absolute left-0 bottom-0 w-full h-[2px] bg-primary"
                  />
                )}
                {location.pathname !== link.path && (
                  <div className="absolute left-0 bottom-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-text-main hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-2 text-text-main hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-0 right-0 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <Link 
              to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'} 
              className="p-2 text-text-main hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <button 
              className="md:hidden p-2 text-text-main hover:bg-gray-100 rounded-full transition-colors" 
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary" onClick={() => setIsMenuOpen(false)}>
                <Leaf className="w-6 h-6 text-success" />
                <span>{settings?.company_name || 'Karakurum Silkrute Traders'}</span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 text-2xl font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`${location.pathname === link.path ? 'text-primary' : 'text-text-muted'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <button 
              onClick={() => setIsSearchOpen(false)} 
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-2xl"
            >
              <h2 className="text-3xl font-bold mb-6 text-center">What are you looking for?</h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products, categories..." 
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full border-b-2 border-gray-300 focus:border-primary bg-transparent py-4 pl-12 pr-4 text-xl outline-none transition-colors"
                  autoFocus
                />
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400" />
              </div>
              {searchQuery.trim().length >= 2 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {searchResults.length > 0 ? searchResults.slice(0, 5).map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug}`}
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                      className="block border-b border-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-50"
                    >
                      <span className="font-semibold">{product.name}</span>
                      <span className="ml-2 text-sm text-slate-400">PKR {Number(product.base_price).toLocaleString()}</span>
                    </Link>
                  )) : <p className="px-4 py-4 text-sm text-slate-500">No matching products.</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
