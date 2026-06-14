import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils.js';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden transition-all duration-200',
        hover && 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 border-b border-secondary-100', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 border-t border-secondary-100', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-secondary-700 font-serif', className)} {...props} />
  )
);

CardTitle.displayName = 'CardTitle';

export default Card;
