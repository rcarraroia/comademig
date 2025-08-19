
import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export const ResponsiveGrid = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className,
}: ResponsiveGridProps) => {
  const { getColumns } = useResponsive();

  const gridCols = getColumns(cols.mobile, cols.tablet, cols.desktop);

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${gridCols}`,
        gapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  );
};
