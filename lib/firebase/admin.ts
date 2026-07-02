import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK — used server-side to verify ID tokens from phone auth.
 *
 * Credentials come from environment variables:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY (base64 encoded or raw with \n)
 *
 * If no credentials are set, admin falls back to application default credentials
 * (works in GCP environments) or is unavailable (token verification will fail gracefully).
 */

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn("[firebase-admin] Missing credentials — phone verification will be unavailable.");
    return null;
  }

  // Handle both raw (with literal \n) and base64-encoded private keys
  const privateKey = privateKeyRaw.includes("-----BEGIN")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : Buffer.from(privateKeyRaw, "base64").toString("utf-8");

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return adminApp;
}

export function getFirebaseAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  const app = getAdminApp();
  if (!app) return null;
  adminAuth = getAuth(app);
  return adminAuth;
}

/**
 * Verify a Firebase ID token and extract the phone number.
 * Returns the verified phone number or null if verification fails.
 */
export async function verifyPhoneToken(idToken: string): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn("[firebase-admin] Auth not available — cannot verify phone token.");
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    return decoded.phone_number ?? null;
  } catch (error) {
    console.error("[firebase-admin] Token verification failed:", (error as Error).message);
    return null;
  }
}
