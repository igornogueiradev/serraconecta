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
      
      const [driversResult, tripsResult, usersResult] = await Promise.all([
        supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        activeDrivers: driversResult.count || 0,
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
