/**
 * Reusable Button Component
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'admin-primary'|'admin-danger'|'admin-ghost'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading
 * @param {import('react').ReactNode} props.icon
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon: Icon, 
  className = '', 
  disabled, 
  as: Component = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    // Main Site Variants
    primary: 'bg-primary text-white hover:bg-opacity-90 rounded-lg',
    secondary: 'bg-secondary text-white hover:bg-opacity-90 rounded-lg',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-lg',
    ghost: 'text-primary hover:bg-emerald-50 rounded-lg',
    danger: 'bg-red-600 text-white hover:bg-red-700 rounded-lg',
    
    // Admin Variants (mapped to index.css admin classes or tailwind)
    'admin-primary': 'admin-btn admin-btn-primary',
    'admin-danger': 'admin-btn admin-btn-danger',
    'admin-ghost': 'admin-btn admin-btn-ghost',
    'admin-outline': 'admin-btn admin-btn-outline',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <Component 
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : Icon && (typeof Icon === 'function' || typeof Icon === 'object') ? <Icon size={size === 'sm' ? 16 : 20} /> : Icon}
      {children}
    </Component>
  );
};

export default Button;
