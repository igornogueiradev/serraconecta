import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  count?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function RatingStars({ value, count, interactive = false, onChange, size = 'sm', onClick }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', onClick && 'cursor-pointer hover:opacity-75 transition-opacity')}
      title={onClick ? 'Ver avaliações' : undefined}
      onClick={onClick}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300',
            interactive && 'cursor-pointer hover:text-amber-400 transition-colors'
          )}
          onClick={(e) => {
            if (interactive) { e.stopPropagation(); onChange?.(star); }
          }}
        />
      ))}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
