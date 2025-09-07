export interface Rating {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  tripId: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: string;
}

export function calculateAverageRating(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
}

export function canRate(ratings: Rating[], raterUserId: string, tripId: string): boolean {
  return !ratings.some(rating => 
    rating.raterUserId === raterUserId && rating.tripId === tripId
  );
}