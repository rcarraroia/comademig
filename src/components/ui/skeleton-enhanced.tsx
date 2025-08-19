
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

const variantStyles = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: '',
  rounded: 'rounded-md',
};

const animationStyles = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer',
  none: '',
};

export const SkeletonEnhanced = ({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'bg-muted',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      aria-label="Carregando..."
      role="status"
    />
  );
};

// Componentes de esqueleto específicos para diferentes layouts
export const CardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-4">
    <SkeletonEnhanced variant="rounded" height={200} />
    <div className="space-y-2">
      <SkeletonEnhanced variant="text" height={20} width="80%" />
      <SkeletonEnhanced variant="text" height={16} width="60%" />
    </div>
    <div className="flex gap-2">
      <SkeletonEnhanced variant="rounded" height={32} width={80} />
      <SkeletonEnhanced variant="rounded" height={32} width={100} />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4">
    <div className="border rounded-lg">
      <div className="grid grid-cols-4 gap-4 p-4 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonEnhanced key={i} variant="text" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
          {Array.from({ length: 4 }).map((_, j) => (
            <SkeletonEnhanced key={j} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  </div>
);
