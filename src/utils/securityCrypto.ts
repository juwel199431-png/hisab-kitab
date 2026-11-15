// Zero-cost browser Web Crypto API security engine for Hisab Kitab
// Provides PBKDF2-SHA256 salted PIN hashing, brute-force lockout tracking,
// and AES-GCM-256 passphrase encryption for backups & sensitive snapshots.

const PIN_SECURITY_KEY = 'hisab_kitab_pin_security_v2';
const LEGACY_PIN_CODE_KEY = 'hisab_kitab_pin_code';
const LEGACY_PIN_ENABLED_KEY = 'hisab_kitab_pin_enabled';

export interface PinSecurityState {
  enabled: boolean;
  pinLength: 4 | 6;
  salt: string;
  hash: string;
  failedAttempts: number;
  lockedUntil: number; // epoch ms, 0 when unlocked
}

export interface EncryptedBackupEnvelope {
  format: 'HISAB_KITAB_ENCRYPTED_V1';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  cipher: 'AES-GCM-256';
  salt: string;
  iv: string;
  ciphertext: string;
  exportedAt: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRandomHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
}

export async function derivePinHashHex(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${saltHex}::hisabkitab::${pin}`);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltHex),
        iterations: 50000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    return toHex(new Uint8Array(derived));
  }

  // Deterministic non-crypto fallback only if Web Crypto is unavailable in insecure HTTP context
  let h1 = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h1 ^= data[i];
    h1 = Math.imul(h1, 0x01000193);
  }
  return `fb-${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export function loadPinSecurityState(): PinSecurityState | null {
  try {
    const raw = localStorage.getItem(PIN_SECURITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PinSecurityState;
      if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.hash === 'string') {
        return {
          enabled: parsed.enabled,
          pinLength: parsed.pinLength === 6 ? 6 : 4,
          salt: parsed.salt || '',
          hash: parsed.hash,
          failedAttempts: Number(parsed.failedAttempts) || 0,
          lockedUntil: Number(parsed.lockedUntil) || 0,
        };
      }
    }
  } catch {
    // ignore corrupt state
  }
  return null;
}

export function savePinSecurityState(state: PinSecurityState): void {
  try {
    localStorage.setItem(PIN_SECURITY_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save PIN security state:', err);
  }
}

export function hasLegacyPlaintextPin(): boolean {
  try {
    const enabled = localStorage.getItem(LEGACY_PIN_ENABLED_KEY) === 'true';
    const pin = localStorage.getItem(LEGACY_PIN_CODE_KEY);
    return Boolean(enabled && pin && /^\d{4,6}$/.test(pin));
  } catch {
    return false;
  }
}

export async function migrateLegacyPinIfNeeded(): Promise<PinSecurityState | null> {
  const existing = loadPinSecurityState();
  if (existing && existing.enabled && existing.hash) {
    // Clean up any leftover legacy plaintext key
    try {
      localStorage.removeItem(LEGACY_PIN_CODE_KEY);
      localStorage.removeItem(LEGACY_PIN_ENABLED_KEY);
    } catch {
      // ignore
    }
    return existing;
  }

  try {
    const legacyEnabled = localStorage.getItem(LEGACY_PIN_ENABLED_KEY) === 'true';
    const legacyPin = localStorage.getItem(LEGACY_PIN_CODE_KEY);
    if (legacyEnabled && legacyPin && /^\d{4,6}$/.test(legacyPin)) {
      const salt = generateRandomHex(16);
      const hash = await derivePinHashHex(legacyPin, salt);
      const migrated: PinSecurityState = {
        enabled: true,
        pinLength: legacyPin.length === 6 ? 6 : 4,
        salt,
        hash,
        failedAttempts: 0,
        lockedUntil: 0,
      };
      savePinSecurityState(migrated);
      localStorage.removeItem(LEGACY_PIN_CODE_KEY);
      localStorage.removeItem(LEGACY_PIN_ENABLED_KEY);
      return migrated;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function createHashedPinState(pin: string): Promise<PinSecurityState> {
  const salt = generateRandomHex(16);
  const hash = await derivePinHashHex(pin, salt);
  const state: PinSecurityState = {
    enabled: true,
    pinLength: pin.length === 6 ? 6 : 4,
    salt,
    hash,
    failedAttempts: 0,
    lockedUntil: 0,
  };
  savePinSecurityState(state);
  try {
    localStorage.removeItem(LEGACY_PIN_CODE_KEY);
    localStorage.removeItem(LEGACY_PIN_ENABLED_KEY);
  } catch {
    // ignore
  }
  return state;
}

export function clearHashedPinState(): void {
  try {
    localStorage.removeItem(PIN_SECURITY_KEY);
    localStorage.removeItem(LEGACY_PIN_CODE_KEY);
    localStorage.removeItem(LEGACY_PIN_ENABLED_KEY);
  } catch {
    // ignore
  }
}

export interface PinVerifyResult {
  ok: boolean;
  lockedRemainingSec: number;
  failedAttempts: number;
  remainingBeforeLock: number;
}

export async function verifyHashedPin(enteredPin: string): Promise<PinVerifyResult> {
  let state = loadPinSecurityState();
  if (!state) {
    state = await migrateLegacyPinIfNeeded();
  }
  if (!state || !state.enabled || !state.hash) {
    return { ok: true, lockedRemainingSec: 0, failedAttempts: 0, remainingBeforeLock: 5 };
  }

  const now = Date.now();
  if (state.lockedUntil > now) {
    const remainingSec = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      ok: false,
      lockedRemainingSec: remainingSec,
      failedAttempts: state.failedAttempts,
      remainingBeforeLock: 0,
    };
  }

  const enteredHash = await derivePinHashHex(enteredPin, state.salt);
  if (enteredHash === state.hash) {
    const resetState: PinSecurityState = {
      ...state,
      failedAttempts: 0,
      lockedUntil: 0,
    };
    savePinSecurityState(resetState);
    return { ok: true, lockedRemainingSec: 0, failedAttempts: 0, remainingBeforeLock: 5 };
  }

  const nextAttempts = (state.failedAttempts || 0) + 1;
  let nextLockedUntil = 0;
  let lockedRemainingSec = 0;

  if (nextAttempts >= 5) {
    // 30s on 5th wrong try, scaling up for repeated brute-force tries (max 5 minutes)
    const tier = Math.min(3, Math.floor((nextAttempts - 5) / 3));
    const lockDurationMs = 30000 * Math.pow(2, tier);
    nextLockedUntil = now + lockDurationMs;
    lockedRemainingSec = Math.ceil(lockDurationMs / 1000);
  }

  savePinSecurityState({
    ...state,
    failedAttempts: nextAttempts,
    lockedUntil: nextLockedUntil,
  });

  return {
    ok: false,
    lockedRemainingSec,
    failedAttempts: nextAttempts,
    remainingBeforeLock: Math.max(0, 5 - nextAttempts),
  };
}

// ============================================================================
// AES-GCM-256 Encrypted Backup Helpers (Zero-Cost Client-Side Encryption)
// ============================================================================

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function isEncryptedBackupEnvelope(obj: unknown): obj is EncryptedBackupEnvelope {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Partial<EncryptedBackupEnvelope>;
  return (
    candidate.format === 'HISAB_KITAB_ENCRYPTED_V1' &&
    typeof candidate.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string'
  );
}

export async function encryptBackupPayload(
  payload: unknown,
  passphrase: string
): Promise<EncryptedBackupEnvelope> {
  if (!passphrase || passphrase.length < 4) {
    throw new Error('এনক্রিপশনের জন্য কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন।');
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('আপনার ব্রাউজারে এনক্রিপশন (Web Crypto) সাপোর্ট পাওয়া যায়নি।');
  }

  const iterations = 100000;
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveAesKey(passphrase, salt, iterations);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    format: 'HISAB_KITAB_ENCRYPTED_V1',
    kdf: 'PBKDF2-SHA256',
    iterations,
    cipher: 'AES-GCM-256',
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encryptedBuf)),
    exportedAt: new Date().toISOString(),
  };
}

export async function decryptBackupPayload(
  envelope: EncryptedBackupEnvelope,
  passphrase: string
): Promise<unknown> {
  if (!passphrase) {
    throw new Error('ফাইল আনলক করতে পাসওয়ার্ড লিখুন।');
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('আপনার ব্রাউজারে ডিক্রিপশন সাপোর্ট পাওয়া যায়নি।');
  }

  try {
    const salt = fromBase64(envelope.salt);
    const iv = fromBase64(envelope.iv);
    const ciphertext = fromBase64(envelope.ciphertext);
    const iterations = Number(envelope.iterations) || 100000;

    const key = await deriveAesKey(passphrase, salt, iterations);
    const decryptedBuf = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
      },
      key,
      ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength) as ArrayBuffer
    );

    const jsonText = new TextDecoder().decode(decryptedBuf);
    return JSON.parse(jsonText);
  } catch {
    throw new Error('ভুল পাসওয়ার্ড অথবা ব্যাকআপ ফাইলটি ক্ষতিগ্রস্ত হয়েছে!');
  }
}
