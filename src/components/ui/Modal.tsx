import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideCloseButton?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, className, size = 'md', hideCloseButton = false }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl animate-slide-in-right',
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-secondary-100">
            <h2 className="text-xl font-semibold text-secondary-800 font-serif">{title}</h2>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors text-secondary-500 hover:text-secondary-700"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className={cn('p-6', !title && 'pt-6')}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
