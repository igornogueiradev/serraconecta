import { useState, useEffect, useCallback } from 'react';
import { listarMotoristas } from '@/integrations/firebase/motoristas';
import type { Motorista } from '@/integrations/firebase/types';

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      setMotoristas(await listarMotoristas());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { motoristas, isLoading, refetch: fetch };
}
