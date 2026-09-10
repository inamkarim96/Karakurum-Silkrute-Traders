import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Input Component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.error
 * @param {import('react').ReactNode} props.icon
 */
const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  type = 'text',
  className = '', 
  containerClassName = '',
  helpText,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`admin-form-group ${containerClassName}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input 
          type={inputType}
          className={`admin-input w-full ${Icon ? '!pl-10' : ''} ${isPassword ? '!pr-10' : ''} ${error ? 'border-red-500 focus:ring-red-200' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-slate-500">{helpText}</p>}
    </div>
  );
};

export default Input;
