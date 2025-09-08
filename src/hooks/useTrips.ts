import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'>;
type TripInsert = Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Erro ao carregar viagens');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as viagens',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTrip = async (tripData: TripInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('trips')
        .insert({ ...tripData, user_id: user.id });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Viagem ofertada com sucesso',
      });
      
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error adding trip:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível ofertar a viagem',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Viagem atualizada com sucesso',
      });
      
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error updating trip:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a viagem',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Viagem removida com sucesso',
      });
      
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error deleting trip:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a viagem',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return {
    trips,
    isLoading,
    error,
    addTrip,
    updateTrip,
    deleteTrip,
    refetch: fetchTrips,
  };
};