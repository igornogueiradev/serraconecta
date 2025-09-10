-- Add service_type column to drivers table
ALTER TABLE public.drivers 
ADD COLUMN service_type TEXT NOT NULL DEFAULT 'coletivo';

-- Add service_type column to trips table
ALTER TABLE public.trips 
ADD COLUMN service_type TEXT NOT NULL DEFAULT 'coletivo';