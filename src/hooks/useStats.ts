import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isExpired } from '@/utils/timeUtils'; // certifique-se que o caminho está correto

interface Stats {
  activeDrivers: number;
  activeTrips: number;
  totalUsers: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    activeDrivers: 0,
    activeTrips: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const [driversResult, tripsResult, usersResult] = await Promise.all([
        supabase
          .from('drivers')
          .select('*'), // buscar todos os motoristas
        supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
      ]);

      // Filtra motoristas não expirados
      const activeDriversCount = (driversResult.data || []).filter(driver =>
        !isExpired(driver.departure_date, driver.departure_time)
      ).length;

      setStats({
        activeDrivers: activeDriversCount,
        activeTrips: tripsResult.count || 0,
        totalUsers: usersResult.count || 0,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    refetch: fetchStats,
  };
};
