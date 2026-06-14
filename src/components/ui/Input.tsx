import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils.js';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, icon, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            {label}
            {props.required && <span className="text-primary-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
