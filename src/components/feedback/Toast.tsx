
import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles = {
  default: 'bg-background border-border',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Toast = ({ 
  id, 
  title, 
  description, 
  variant = 'default', 
  duration = 5000, 
  onClose 
}: ToastProps) => {
  const Icon = variantIcons[variant];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'relative flex items-start gap-3 p-4 border rounded-lg shadow-lg',
        'animate-in slide-in-from-right-full',
        variantStyles[variant]
      )}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        {description && (
          <div className="text-sm opacity-90 mt-1">{description}</div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onClose(id)}
        className="flex-shrink-0 h-6 w-6 p-0"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </Button>
    </div>
  );
};
