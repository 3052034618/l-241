import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils.js';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      ghost: 'bg-transparent text-secondary-600 hover:bg-secondary-100 focus:ring-secondary-300',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
