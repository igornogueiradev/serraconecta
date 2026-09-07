import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from './RatingStars';
import { useRatings } from '@/hooks/useRatings';
import type { Rating } from '@/integrations/firebase/types';

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function ReviewsDialog({ open, onOpenChange, userId, userName }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchReviewsForUser } = useRatings();

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    fetchReviewsForUser(userId).then(r => {
      setReviews(r);
      setLoading(false);
    });
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliações de {userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma avaliação ainda.
          </p>
        ) : (
          <div className="space-y-4 pt-2">
            {reviews.map(r => (
              <div key={r.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <RatingStars value={r.score} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  {r.rater_name ?? 'Motorista'}
                </p>
                {r.comment && (
                  <p className="text-sm text-muted-foreground mt-0.5 italic">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
