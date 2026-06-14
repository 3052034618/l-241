import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils.js';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
