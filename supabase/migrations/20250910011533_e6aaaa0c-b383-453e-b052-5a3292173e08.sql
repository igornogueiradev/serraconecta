-- Add missing baggage and passenger fields to trips table
ALTER TABLE public.trips 
ADD COLUMN baggage_23kg INTEGER NOT NULL DEFAULT 0,
ADD COLUMN baggage_10kg INTEGER NOT NULL DEFAULT 0,
ADD COLUMN baggage_bags INTEGER NOT NULL DEFAULT 0,
ADD COLUMN adults_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN children_count INTEGER NOT NULL DEFAULT 0;