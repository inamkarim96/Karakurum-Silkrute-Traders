/**
 * Reusable Badge Component
 * @param {Object} props
 * @param {'success'|'warning'|'error'|'info'|'neutral'} props.variant
 * @param {boolean} props.pill
 */
const Badge = ({ 
  children, 
  variant = 'neutral', 
  pill = true, 
  className = '',
  ...props 
}) => {
  const baseClasses = `admin-badge ${pill ? 'rounded-full' : 'rounded-md'} font-bold`;
  
  const variants = {
    success: 'admin-badge-success',
    warning: 'admin-badge-warning',
    error: 'admin-badge-danger',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-gray-100 text-gray-700',
  };

  const variantClass = variants[variant] || variants.neutral;

  return (
    <span 
      className={`${baseClasses} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
