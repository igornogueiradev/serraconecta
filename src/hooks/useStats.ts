import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { isExpired } from '@/utils/timeUtils';

interface Stats {
  activeDrivers: number;
  activeTrips: number;
  totalUsers: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({ activeDrivers: 0, activeTrips: 0, totalUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const [driversSnap, tripsCount, usersCount] = await Promise.all([
        getDocs(query(collection(db, 'drivers'), where('status', '==', 'active'))),
        getCountFromServer(query(collection(db, 'trips'), where('status', '==', 'active'))),
        getCountFromServer(collection(db, 'users')),
      ]);

      const activeDriversCount = driversSnap.docs.filter(d => {
        const { departure_date, departure_time } = d.data();
        return !isExpired(departure_date, departure_time);
      }).length;

      setStats({
        activeDrivers: activeDriversCount,
        activeTrips: tripsCount.data().count,
        totalUsers: usersCount.data().count,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return { stats, isLoading, refetch: fetchStats };
};
