import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Rating } from "@/utils/rating";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRating: (rating: Omit<Rating, 'id' | 'createdAt'>) => void;
  ratedUserId: string;
  raterUserId: string;
  tripId: string;
  ratedUserName: string;
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  onSubmitRating, 
  ratedUserId, 
  raterUserId, 
  tripId,
  ratedUserName 
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmitRating({
        ratedUserId,
        raterUserId,
        tripId,
        rating,
        comment: comment.trim() || undefined
      });
      
      // Reset form
      setRating(0);
      setComment("");
      setHoveredStar(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {ratedUserName}</DialogTitle>
          <DialogDescription>
            Ajude outros usuários compartilhando sua experiência
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Como foi sua experiência?
            </p>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Compartilhe detalhes sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1"
            >
              Enviar Avaliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}