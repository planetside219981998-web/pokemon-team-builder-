import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAppStore } from '@/store/appStore';

export function Layout() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncMessage = useAppStore((s) => s.syncMessage);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col bg-pattern">
      <Header />
      <Navigation />

      {/* Sync status banner */}
      {(syncStatus === 'downloading' || syncStatus === 'checking') && (
        <div className="border-b px-4 py-2 text-sm text-center animate-slideDown" style={{
          background: 'linear-gradient(90deg, rgba(29, 78, 216, 0.15), rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.15))',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          color: '#93c5fd',
        }}>
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {syncMessage}
          </span>
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="border-b px-4 py-2 text-sm text-center" style={{
          background: 'linear-gradient(90deg, rgba(153, 27, 27, 0.15), rgba(239, 68, 68, 0.15), rgba(153, 27, 27, 0.15))',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
        }}>
          {syncMessage}
        </div>
      )}
      {syncStatus === 'offline' && (
        <div className="border-b px-4 py-2 text-sm text-center" style={{
          background: 'linear-gradient(90deg, rgba(120, 53, 15, 0.15), rgba(245, 158, 11, 0.15), rgba(120, 53, 15, 0.15))',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          color: '#fcd34d',
        }}>
          {syncMessage}
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 pb-24 md:pb-5">
        <Outlet />
      </main>
    </div>
  );
}
