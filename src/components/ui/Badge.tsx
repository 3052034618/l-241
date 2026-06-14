import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils.js';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-secondary-100 text-secondary-700',
      primary: 'bg-primary-100 text-primary-700',
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      danger: 'bg-red-100 text-red-700',
      secondary: 'bg-secondary-100 text-secondary-700',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
