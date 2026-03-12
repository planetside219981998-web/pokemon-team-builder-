import { getMeta, setMeta, hasData } from './db';
import { fetchCoreData, fetchRankings, fetchGroups, hasRankings } from './fetcher';
import { URLS } from './constants';
import type { SyncStatus } from './types';

interface SyncResult {
  status: SyncStatus;
  message: string;
}

// Check the latest commit SHA from PvPoke repo
async function getRemoteSha(): Promise<string | null> {
  try {
    const res = await fetch(URLS.commitSha, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha as string;
  } catch {
    return null;
  }
}

// Main sync function - called on app start
export async function syncData(
  onStatus: (status: SyncStatus, message: string) => void
): Promise<SyncResult> {
  const dataExists = await hasData();

  // If offline and have data, use cached
  if (!navigator.onLine) {
    if (dataExists) {
      onStatus('ready', 'Using cached data (offline)');
      return { status: 'ready', message: 'Using cached data (offline)' };
    }
    onStatus('offline', 'No internet and no cached data');
    return { status: 'offline', message: 'No internet and no cached data' };
  }

  // Check for updates
  onStatus('checking', 'Checking for data updates...');
  const remoteSha = await getRemoteSha();
  const localSha = await getMeta('commitSha');

  const needsUpdate = !dataExists || !localSha || (remoteSha && remoteSha !== localSha);

  if (!needsUpdate) {
    onStatus('ready', 'Data is up to date');
    return { status: 'ready', message: 'Data is up to date' };
  }

  // Download core data
  try {
    onStatus('downloading', 'Downloading Pokemon data...');
    await fetchCoreData();

    // Fetch Great League rankings by default (most popular)
    onStatus('downloading', 'Downloading Great League rankings...');
    await fetchRankings('all', 1500);
    await fetchGroups('all');

    // Save the commit SHA
    if (remoteSha) {
      await setMeta('commitSha', remoteSha);
    }
    await setMeta('lastSync', new Date().toISOString());

    onStatus('ready', 'Data loaded successfully');
    return { status: 'ready', message: 'Data loaded successfully' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (dataExists) {
      onStatus('ready', `Update failed, using cached data: ${msg}`);
      return { status: 'ready', message: `Update failed, using cached data: ${msg}` };
    }
    onStatus('error', `Failed to load data: ${msg}`);
    return { status: 'error', message: `Failed to load data: ${msg}` };
  }
}

// Ensure rankings for a specific league are loaded (lazy loading)
export async function ensureRankings(league: string, cp: number): Promise<void> {
  const exists = await hasRankings(league, cp);
  if (exists) return;

  await fetchRankings(league, cp);
  await fetchGroups(league);
}
