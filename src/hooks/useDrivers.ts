import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Driver = Tables<'drivers'> & {
  profiles?: {
    full_name: string;
    phone: string;
  } | null;
};
type DriverInsert = Omit<Tables<'drivers'>, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      // Fetch profiles for these drivers
      const userIds = driversData?.map(driver => driver.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Join the data
      const driversWithProfiles = driversData?.map(driver => ({
        ...driver,
        profiles: profilesData?.find(profile => profile.user_id === driver.user_id) || null
      })) || [];

      setDrivers(driversWithProfiles as Driver[]);
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

  const fetchMyDrivers = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Fetch user's drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      // Fetch profile for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Join the data
      const driversWithProfile = driversData?.map(driver => ({
        ...driver,
        profiles: profileData
      })) || [];

      return driversWithProfile as Driver[];
    } catch (err) {
      console.error('Error fetching my drivers:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas disponibilidades',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    drivers,
    isLoading,
    error,
    addDriver,
    updateDriver,
    deleteDriver,
    refetch: fetchDrivers,
    fetchMyDrivers,
  };
};