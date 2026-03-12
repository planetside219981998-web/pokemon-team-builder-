import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAppStore } from '@/store/appStore';

export function Layout() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncMessage = useAppStore((s) => s.syncMessage);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Header />
      <Navigation />

      {/* Sync status banner */}
      {(syncStatus === 'downloading' || syncStatus === 'checking') && (
        <div className="bg-blue-900/50 border-b border-blue-700 px-4 py-2 text-sm text-blue-200 text-center">
          {syncMessage}
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 text-sm text-red-200 text-center">
          {syncMessage}
        </div>
      )}
      {syncStatus === 'offline' && (
        <div className="bg-yellow-900/50 border-b border-yellow-700 px-4 py-2 text-sm text-yellow-200 text-center">
          {syncMessage}
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 pb-20 md:pb-4">
        <Outlet />
      </main>
    </div>
  );
}
