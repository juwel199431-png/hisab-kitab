import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppData } from './types/finance';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with Database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const LEDGER_DOC_ID = 'main';
let lastSentPayloadHash: string | null = null;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialSyncCompleted = false;

/**
 * Subscribe to real-time changes from the cloud ledger.
 * This runs continuously on both mobile and computer.
 * When an entry is made on device A, device B immediately receives the update.
 */
export function subscribeToCloudLedger(
  onDataReceived: (cloudData: AppData) => void,
  onInitialEmpty?: () => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ledgerRef = doc(db, 'financialLedgers', LEDGER_DOC_ID);

    const unsubscribe = onSnapshot(
      ledgerRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          isInitialSyncCompleted = true;
          if (onInitialEmpty) {
            onInitialEmpty();
          }
          return;
        }

        const data = docSnap.data();
        isInitialSyncCompleted = true;

        if (data && typeof data.payload === 'string') {
          // If this update matches our last local save, ignore to avoid re-trigger loops
          if (data.payload === lastSentPayloadHash) {
            return;
          }

          try {
            const parsedData = JSON.parse(data.payload) as AppData;
            if (parsedData && Array.isArray(parsedData.banks) && Array.isArray(parsedData.transactions)) {
              lastSentPayloadHash = data.payload;
              onDataReceived(parsedData);
            }
          } catch (parseErr) {
            console.error('Failed to parse cloud ledger payload:', parseErr);
          }
        }
      },
      (error) => {
        console.warn('Real-time Firestore ledger listener error:', error);
        isInitialSyncCompleted = true; // Fallback so local saves are not blocked
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error attaching cloud ledger listener:', err);
    isInitialSyncCompleted = true;
    return () => {};
  }
}

/**
 * Save data to the cloud ledger document with an automatic debounce.
 * This pushes changes from the current device to the cloud,
 * instantly triggering the listener on the user's other devices.
 */
export function pushToCloudLedger(data: AppData, force: boolean = false): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  // If initial sync hasn't occurred and not forced, wait for snapshot first
  if (!isInitialSyncCompleted && !force) {
    return;
  }

  saveDebounceTimer = setTimeout(async () => {
    try {
      const payloadString = JSON.stringify(data);
      if (payloadString === lastSentPayloadHash) {
        return;
      }

      lastSentPayloadHash = payloadString;
      const ledgerRef = doc(db, 'financialLedgers', LEDGER_DOC_ID);

      await setDoc(
        ledgerRef,
        {
          ledgerId: LEDGER_DOC_ID,
          payload: payloadString,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not push to cloud ledger (will retry or use local storage):', err);
    }
  }, force ? 50 : 500);
}
