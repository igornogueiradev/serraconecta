import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './RatingStars';
import { useRatings } from '@/hooks/useRatings';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  ratedUserId: string;
  ratedUserName: string;
  onSuccess?: () => void;
}

export function RatingDialog({ open, onOpenChange, requestId, ratedUserId, ratedUserName, onSuccess }: RatingDialogProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const { isLoading, submitRating } = useRatings();

  const handleSubmit = async () => {
    if (score === 0) return;
    const ok = await submitRating({ request_id: requestId, rated_user_id: ratedUserId, score, comment: comment || undefined });
    if (ok) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Avaliar Motorista</DialogTitle>
          <DialogDescription>Como foi sua experiência com {ratedUserName}?</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex justify-center">
            <RatingStars value={score} interactive onChange={setScore} size="md" />
          </div>
          <Textarea
            placeholder="Comentário opcional..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={score === 0 || isLoading} className="flex-1">
              {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
