
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loading = React.memo(({ size = 'md', text, className }: LoadingProps) => {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      'flex items-center justify-center gap-2 text-muted-foreground',
      className
    )}>
      <Loader2 className={cn('animate-spin', iconSizes[size])} />
      {text && (
        <span className="text-sm font-medium" role="status" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
});

Loading.displayName = 'Loading';

// Skeleton components for better loading states
export const OrderSkeleton = React.memo(() => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-6 bg-muted rounded w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
));

OrderSkeleton.displayName = 'OrderSkeleton';
