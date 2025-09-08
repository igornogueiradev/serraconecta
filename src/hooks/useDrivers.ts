import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Driver = Tables<'drivers'>;
type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Erro ao carregar motoristas');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os motoristas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDriver = async (driverData: DriverInsert) => {
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
        .from('drivers')
        .insert({ ...driverData, user_id: user.id });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Disponibilidade cadastrada com sucesso',
      });
      
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error adding driver:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar a disponibilidade',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateDriver = async (id: string, updates: Partial<Driver>) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Disponibilidade atualizada com sucesso',
      });
      
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error updating driver:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a disponibilidade',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Disponibilidade removida com sucesso',
      });
      
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error deleting driver:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a disponibilidade',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return {
    drivers,
    isLoading,
    error,
    addDriver,
    updateDriver,
    deleteDriver,
    refetch: fetchDrivers,
  };
};