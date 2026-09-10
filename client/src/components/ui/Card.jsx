import { motion } from 'framer-motion';

/**
 * Glassmorphism Card
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 */
const Card = ({ children, className = '' }) => (
  <motion.div
    className={`backdrop-blur-lg bg-white/30 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/30 rounded-xl shadow-xl ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default Card;
