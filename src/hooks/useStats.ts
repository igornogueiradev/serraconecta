import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      
const [driversData, tripsResult, usersResult] = await Promise.all([
  supabase
    .from('drivers')
    .select('id, departure_date, departure_time', { head: false }), // buscamos as datas
  supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active'),
  supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true }),
]);

// Filtra motoristas ativos e não expirados
const activeDriversCount = driversData?.filter(driver => 
  driver && !isExpired(driver.departure_date, driver.departure_time)
).length || 0;

setStats({
  activeDrivers: activeDriversCount,
  activeTrips: tripsResult.count || 0,
  totalUsers: usersResult.count || 0,
});    } catch (error) {
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
