import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppData } from './types/finance';
import { validateAndSanitizeAppData } from './utils/storage';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with exact Database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth & Google Provider
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const AUTHORIZED_OWNER_EMAIL = 'juwel199431@gmail.com';
const LEDGER_DOC_ID = 'main';
const MAX_PAYLOAD_BYTES = 980000; // Strict boundary matching firebase-blueprint.json

let lastSentPayloadHash: string | null = null;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialSyncCompleted = false;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): Error {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serialized);
  return new Error(serialized);
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  throw buildFirestoreError(error, operationType, path);
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function isAuthorizedCloudOwner(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()
  );
}

export async function signInCloudWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (!isAuthorizedCloudOwner(result.user)) {
    const email = result.user.email || 'Unknown';
    await signOut(auth);
    throw new Error(
      `অননুমোদিত অ্যাকাউন্ট (${email})! ক্লাউড লেজার শুধুমাত্র ${AUTHORIZED_OWNER_EMAIL}-এর জন্য সংরক্ষিত।`
    );
  }
  return result.user;
}

export async function signOutCloud(): Promise<void> {
  isInitialSyncCompleted = false;
  lastSentPayloadHash = null;
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user && !isAuthorizedCloudOwner(user)) {
      // Immediately sign out unauthorized Google accounts before any Firestore access
      signOut(auth).catch(() => {});
      callback(null);
      return;
    }
    callback(user);
  });
}

/**
 * Subscribe to real-time changes from the owner-locked cloud ledger.
 * Strictly requires verified owner authentication.
 */
export function subscribeToCloudLedger(
  onDataReceived: (cloudData: AppData) => void,
  onInitialEmpty?: () => void,
  onError?: (err: Error) => void
): () => void {
  const currentUser = auth.currentUser;
  if (!isAuthorizedCloudOwner(currentUser)) {
    isInitialSyncCompleted = false;
    return () => {};
  }

  const path = `financialLedgers/${LEDGER_DOC_ID}`;
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
          if (data.payload === lastSentPayloadHash) {
            return;
          }

          try {
            const parsedRaw = JSON.parse(data.payload);
            const validated = validateAndSanitizeAppData(parsedRaw);
            if (validated) {
              lastSentPayloadHash = data.payload;
              onDataReceived(validated);
            }
          } catch (parseErr) {
            console.error('Failed to parse cloud ledger payload:', parseErr);
          }
        }
      },
      (error) => {
        const structuredErr = buildFirestoreError(error, OperationType.GET, path);
        isInitialSyncCompleted = true;
        if (onError) onError(structuredErr);
      }
    );

    return unsubscribe;
  } catch (err) {
    const structuredErr = buildFirestoreError(err, OperationType.GET, path);
    isInitialSyncCompleted = true;
    if (onError) onError(structuredErr);
    return () => {};
  }
}

/**
 * Save validated data to the owner-locked cloud ledger document with debounce.
 */
export function pushToCloudLedger(
  data: AppData,
  force: boolean = false,
  onError?: (err: Error) => void
): void {
  const currentUser = auth.currentUser;
  if (!isAuthorizedCloudOwner(currentUser) || !currentUser?.email) {
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  if (!isInitialSyncCompleted && !force) {
    return;
  }

  saveDebounceTimer = setTimeout(async () => {
    const user = auth.currentUser;
    if (!isAuthorizedCloudOwner(user) || !user?.email) {
      return;
    }

    const path = `financialLedgers/${LEDGER_DOC_ID}`;
    try {
      const payloadString = JSON.stringify(data);
      if (payloadString.length > MAX_PAYLOAD_BYTES) {
        throw new Error('Cloud ledger payload exceeds 1MB Firestore document limit.');
      }

      if (payloadString === lastSentPayloadHash && !force) {
        return;
      }

      lastSentPayloadHash = payloadString;
      const ledgerRef = doc(db, 'financialLedgers', LEDGER_DOC_ID);

      await setDoc(
        ledgerRef,
        {
          ledgerId: LEDGER_DOC_ID,
          ownerUid: user.uid,
          ownerEmail: user.email,
          payload: payloadString,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      const structuredErr = buildFirestoreError(err, OperationType.WRITE, path);
      if (onError) onError(structuredErr);
    }
  }, force ? 50 : 500);
}
