import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../api/site';

const WhatsAppButton = () => {
  const [settings, setSettings] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const rawNumber = settings?.whatsapp || settings?.phone || '923000000000';
  const cleanNumber = rawNumber.replace(/\D/g, '');
  const message = encodeURIComponent(
    'Hello Karakurum Silkrute Traders! I would like to inquire about your products, wholesale rates, and cargo services.'
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="hidden sm:block bg-gray-900 text-white text-xs font-medium py-2 px-3 rounded-xl shadow-xl border border-gray-700 whitespace-nowrap"
          >
            💬 Chat for Wholesale & Orders
            <div className="text-[10px] text-emerald-400">Danyore Silk Route Support</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative group flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-300"
      >
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-30 animate-ping pointer-events-none" />
        <FaWhatsapp className="w-8 h-8 text-white relative z-10" />
      </motion.a>
    </div>
  );
};

export default WhatsAppButton;
