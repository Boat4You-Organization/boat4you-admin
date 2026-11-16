/* global PublicKeyCredential, AuthenticatorAssertionResponse, AuthenticatorAttestationResponse, UserVerificationRequirement */

/**
 * Passkeys (WebAuthn) for the two-step admin sign-in (16.11.2026): Face ID / Touch ID through the browser's own
 * navigator.credentials, no library. The backend sends and takes binary fields as base64url strings.
 */

export const passkeysSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined' && !!navigator.credentials;

const toBase64Url = (buffer: ArrayBuffer | null | undefined): string => {
  if (!buffer) return '';

  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): ArrayBuffer => {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  return bytes.buffer;
};

export interface PasskeyRequestOptions {
  challenge: string;
  rpId: string;
  allowCredentials: string[];
  timeout: number;
  userVerification: UserVerificationRequirement;
  challengeToken: string;
}

export interface PasskeyAssertionPayload {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string | null;
}

/** Sign in with a passkey: the system sheet asks for Face ID / Touch ID. Null when cancelled. */
export const getPasskeyAssertion = async (options: PasskeyRequestOptions): Promise<PasskeyAssertionPayload | null> => {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: fromBase64Url(options.challenge),
      rpId: options.rpId,
      allowCredentials: options.allowCredentials.map(id => ({ type: 'public-key' as const, id: fromBase64Url(id) })),
      userVerification: options.userVerification,
      timeout: options.timeout,
    },
  })) as PublicKeyCredential | null;

  if (!credential) return null;

  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    credentialId: toBase64Url(credential.rawId),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature),
    userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
  };
};

export interface PasskeyCreationOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  excludeCredentials: string[];
  timeout: number;
  challengeToken: string;
}

export interface PasskeyRegistrationPayload {
  clientDataJSON: string;
  attestationObject: string;
  transports: string[];
}

/** Add a passkey to this account: the system sheet saves it to iCloud Keychain / the device. Null when cancelled. */
export const createPasskey = async (options: PasskeyCreationOptions): Promise<PasskeyRegistrationPayload | null> => {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: fromBase64Url(options.challenge),
      rp: options.rp,
      user: { ...options.user, id: fromBase64Url(options.user.id) },
      pubKeyCredParams: options.pubKeyCredParams,
      excludeCredentials: options.excludeCredentials.map(id => ({ type: 'public-key' as const, id: fromBase64Url(id) })),
      timeout: options.timeout,
      attestation: 'none',
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    },
  })) as PublicKeyCredential | null;

  if (!credential) return null;

  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    clientDataJSON: toBase64Url(response.clientDataJSON),
    attestationObject: toBase64Url(response.attestationObject),
    transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
  };
};
