import { useEffect } from 'react';
import { syncData } from '@/data/sync';
import { useAppStore } from '@/store/appStore';

export function useDataSync() {
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncMessage = useAppStore((s) => s.syncMessage);

  useEffect(() => {
    syncData((status, message) => {
      setSyncStatus(status, message);
    });
  }, [setSyncStatus]);

  return { syncStatus, syncMessage };
}
