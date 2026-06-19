// Cognito hosted-UI authentication.
//
// Flow (OAuth 2.0 + PKCE):
//   1. signIn() generates a PKCE code_verifier + code_challenge,
//      builds the authorize URL, opens it in the system browser.
//   2. User authenticates with Google via the Cognito hosted UI.
//   3. Cognito redirects to `smaran://callback?code=...`.
//   4. The deep-link handler in app/(auth)/callback.tsx exchanges
//      the code for tokens (POST to /oauth2/token) and stores
//      them in AsyncStorage.
//
// The tokens (id, access, refresh) live in AsyncStorage. The id
// token is the bearer token used by the AppSync GraphQL client.
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';

import { ApiError, type AuthSession, type User } from './api/types';
import { config } from './config';
import { notifySessionChanged } from './api/session';
import { bytesToBase64url, base64urlToString } from './base64url';

// Refresh tokens proactively this many ms before expiry so an
// in-flight AppSync call doesn't hit a 401 mid-request.
const REFRESH_BUFFER_MS = 60_000;

const STORAGE_KEY = 'smaran.auth.tokens.v1';
const BROWSER_REDIRECT = makeRedirectUri({ scheme: 'smaran', path: 'callback' });
const LOGOUT_REDIRECT = makeRedirectUri({ scheme: 'smaran', path: 'signout' });

// --- PKCE helpers ---
function stringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  // 32 random bytes -> 43 char base64url. We use that as the
  // verifier (no need to hash the random bytes — the verifier IS
  // the secret). `expo-crypto` is the React-Native-safe random
  // source; the browser `crypto.getRandomValues` global doesn't
  // exist on iOS/Android.
  const random = await Crypto.getRandomBytesAsync(32);
  const verifier = bytesToBase64url(random);
  const challenge = bytesToBase64url(
    new Uint8Array(
      await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        stringToBytes(verifier) as unknown as BufferSource,
      ),
    ),
  );
  return { verifier, challenge };
}

// --- Storage ---
type StoredTokens = {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // ms epoch
  userId: string;
  email: string;
  name: string;
};

async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function saveTokens(t: StoredTokens): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// --- Auth API ---

/**
 * Open the Cognito hosted UI in the system browser. Returns a
 * promise that resolves when the user has authenticated and the
 * authorization code is exchanged for tokens. The promise rejects
 * on user-cancel or any error.
 */
export async function signIn(): Promise<AuthSession> {
  if (!config.hostedUiDomain || !config.userPoolClientId) {
    throw new ApiError('network', 'App is not configured for this environment');
  }
  const { verifier, challenge } = await generatePkce();
  const state = bytesToBase64url(await Crypto.getRandomBytesAsync(16));

  const authorizeUrl = new URL(
    `https://${config.hostedUiDomain}/oauth2/authorize`,
  );
  authorizeUrl.searchParams.set('client_id', config.userPoolClientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('redirect_uri', BROWSER_REDIRECT);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('identity_provider', 'Google');

  const result = await WebBrowser.openAuthSessionAsync(
    authorizeUrl.toString(),
    BROWSER_REDIRECT,
  );
  if (result.type !== 'success' || !result.url) {
    throw new ApiError('unauthenticated', 'Sign-in cancelled');
  }
  const url = new URL(result.url);
  if (url.searchParams.get('state') !== state) {
    throw new ApiError('unauthenticated', 'state mismatch');
  }
  const code = url.searchParams.get('code');
  const errParam = url.searchParams.get('error');
  if (errParam) {
    throw new ApiError(
      'unauthenticated',
      url.searchParams.get('error_description') ?? errParam,
    );
  }
  if (!code) {
    throw new ApiError('unauthenticated', 'missing authorization code');
  }

  const tokens = await exchangeCodeForTokens(code, verifier);
  await saveTokens(tokens);
  notifySessionChanged();
  return tokensToSession(tokens);
}

/** Exchange the auth code for tokens by POSTing to /oauth2/token. */
async function exchangeCodeForTokens(
  code: string,
  verifier: string,
): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.userPoolClientId,
    code,
    redirect_uri: BROWSER_REDIRECT,
    code_verifier: verifier,
  });
  const res = await fetch(`https://${config.hostedUiDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError('unauthenticated', `token exchange failed: ${text}`);
  }
  const json = (await res.json()) as {
    id_token: string;
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const claims = decodeJwt(json.id_token);
  return {
    idToken: json.id_token,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    userId: claims.sub,
    email: claims.email ?? '',
    name: claims.name ?? claims.email ?? 'User',
  };
}

/** Clear tokens and revoke the refresh token. */
export async function signOut(): Promise<void> {
  const tokens = await loadTokens();
  await clearTokens();
  notifySessionChanged();
  if (tokens?.refreshToken) {
    try {
      await fetch(`https://${config.hostedUiDomain}/oauth2/revoke`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: tokens.refreshToken,
          client_id: config.userPoolClientId,
        }).toString(),
      });
    } catch {
      // Best-effort. Local clear is enough.
    }
  }
}

/** Return the current user from the id token claims, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (Date.now() >= tokens.expiresAt - REFRESH_BUFFER_MS) {
    if (!tokens.refreshToken) {
      await clearTokens();
      return null;
    }
    try {
      const fresh = await refreshTokens(tokens.refreshToken);
      await saveTokens(fresh);
      return tokensToSession(fresh).user;
    } catch {
      await clearTokens();
      return null;
    }
  }
  return {
    id: tokens.userId,
    email: tokens.email,
    name: tokens.name,
    createdAt: '',
  };
}

/** Returns the current valid id token, refreshing if necessary. */
export async function getIdToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - REFRESH_BUFFER_MS) return tokens.idToken;
  if (!tokens.refreshToken) {
    await clearTokens();
    return null;
  }
  try {
    const fresh = await refreshTokens(tokens.refreshToken);
    await saveTokens(fresh);
    return fresh.idToken;
  } catch {
    await clearTokens();
    return null;
  }
}

async function refreshTokens(refreshToken: string): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.userPoolClientId,
    refresh_token: refreshToken,
  });
  const res = await fetch(`https://${config.hostedUiDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new ApiError('unauthenticated', 'refresh failed');
  }
  const json = (await res.json()) as {
    id_token: string;
    access_token: string;
    expires_in: number;
  };
  const claims = decodeJwt(json.id_token);
  return {
    idToken: json.id_token,
    accessToken: json.access_token,
    refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
    userId: claims.sub,
    email: claims.email ?? '',
    name: claims.name ?? claims.email ?? 'User',
  };
}

function tokensToSession(t: StoredTokens): AuthSession {
  return {
    user: {
      id: t.userId,
      email: t.email,
      name: t.name,
      createdAt: '',
    },
    token: t.idToken,
  };
}

// Minimal JWT decode (no signature verification — we trust the
// HTTPS transport; the server validates on every GraphQL call).
type Claims = { sub: string; email?: string; name?: string; exp: number };
function decodeJwt(token: string): Claims {
  const payload = token.split('.')[1];
  return JSON.parse(base64urlToString(payload)) as Claims;
}

export const REDIRECT_URI = BROWSER_REDIRECT;
export const SIGNOUT_REDIRECT_URI = LOGOUT_REDIRECT;
