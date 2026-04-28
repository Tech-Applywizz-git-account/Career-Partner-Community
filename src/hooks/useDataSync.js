import { useState, useEffect, useCallback, useRef } from 'react';
import { runFullSync, isSyncNeeded, getLastSyncStatus } from '../dataSyncService';
import useAuth from './useAuth';

/**
 * Auto-syncs external DB → main DB:
 * - On mount if > 30 min since last sync
 * - Every 30 minutes via setInterval while user is active
 * - Works for ALL authenticated users (not just admins)
 * - Never deletes existing data in target tables
 */
const useDataSync = () => {
    const { user, isAdmin } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [syncError, setSyncError] = useState(null);
    const [lastSyncLogs, setLastSyncLogs] = useState([]);
    const isSyncingRef = useRef(false); // Ref to prevent concurrent syncs across renders

    const performSync = useCallback(async (force = false) => {
        if (isSyncingRef.current) return; // Prevent concurrent syncs

        isSyncingRef.current = true;
        setSyncing(true);
        setSyncError(null);

        try {
            const result = await runFullSync(force);
            setSyncResult(result);

            if (isAdmin) {
                await fetchSyncLogs();
            }
        } catch (error) {
            console.error('Sync error:', error);
            setSyncError(error.message || 'Sync failed');
        } finally {
            isSyncingRef.current = false;
            setSyncing(false);
        }
    }, [isAdmin]);

    // Auto-sync on user login — run immediately if 30+ min since last sync
    useEffect(() => {
        if (!user) return;

        if (isSyncNeeded()) {
            performSync(false);
        }

        // Re-check every 30 minutes while user is active
        const interval = setInterval(() => {
            if (isSyncNeeded()) {
                performSync(false);
            }
        }, 30 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user, performSync]); // Re-run when user changes (login/logout)

    // Fetch last sync logs for admin dashboard
    useEffect(() => {
        if (isAdmin) {
            fetchSyncLogs();
        }
    }, [isAdmin]);

    const fetchSyncLogs = async () => {
        try {
            const logs = await getLastSyncStatus();
            setLastSyncLogs(logs);
        } catch (error) {
            console.error('Error fetching sync logs:', error);
        }
    };

    return {
        syncing,
        syncResult,
        syncError,
        lastSyncLogs,
        triggerSync: () => performSync(true),
        isSyncNeeded: isSyncNeeded()
    };
};

export default useDataSync;
