import { encodeBase64, decodeBase64, importKey, exportKey, encrypt, decrypt } from './crypto';
import { BiometricData } from '../types';

/**
 * This library handles the WebAuthn PRF (Pseudo-Random Function) extension.
 * It allows us to securely "wrap" the encryption key using the device's authenticator
 * (TouchID/FaceID) without the key ever leaving the device or being stored in plaintext.
 */

const IS_SUPPORTED = typeof PublicKeyCredential !== 'undefined' && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

export const isBiometricSupported = async (): Promise<boolean> => {
    if (!IS_SUPPORTED) return false;
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch {
        return false;
    }
};

// --- Helpers for WebAuthn Encoding ---
const strToBin = (str: string) => Uint8Array.from(str, c => c.charCodeAt(0));

/**
 * Registers a new WebAuthn credential with the PRF extension enabled.
 * 
 * NOTE: We use a robust "Two-Step" process (Create -> Get).
 * Attempting to get the PRF key during creation ("One-Step") is inconsistent 
 * across Android versions and often leads to the extension being ignored entirely.
 */
export const registerBiometric = async (masterKey: CryptoKey, userId: string): Promise<BiometricData> => {
    if (!IS_SUPPORTED) throw new Error("WebAuthn not supported");

    // 1. Generate Salt and Challenge
    const saltBuffer = window.crypto.getRandomValues(new Uint8Array(32));
    const saltBase64 = encodeBase64(saltBuffer.buffer);
    
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const id = strToBin(userId); // User ID handle

    // 2. Step A: Create Credential (enable PRF capability ONLY)
    // We DO NOT pass 'eval' here. Passing values during creation is flaky on Android.
    // We just ask for the extension to be enabled.
    const creationOptions: any = {
        publicKey: {
            challenge,
            rp: { name: "Diary App", id: window.location.hostname },
            user: {
                id,
                name: "diary-user", 
                displayName: "Diary Owner"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }], // ES256 and RS256
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // FaceID/TouchID
                userVerification: 'required',
                requireResidentKey: false
            },
            timeout: 60000,
            extensions: {
                prf: {} // Enable PRF, but don't evaluate yet
            }
        }
    };

    const credential = await navigator.credentials.create(creationOptions) as any;
    if (!credential) throw new Error("Failed to create credential");

    const credentialId = encodeBase64(credential.rawId);
    
    // 3. Step B: Assert (Login) to get the PRF Key
    // Now we immediately use the new credential to perform an evaluation.
    const assertionOptions: any = {
        publicKey: {
            challenge: window.crypto.getRandomValues(new Uint8Array(32)),
            rpId: window.location.hostname,
            allowCredentials: [{
                type: 'public-key',
                id: credential.rawId
            }],
            userVerification: 'required',
            extensions: {
                prf: {
                    eval: {
                        first: saltBuffer
                    }
                }
            }
        }
    };

    const assertion = await navigator.credentials.get(assertionOptions) as any;
    const getResults = assertion?.getClientExtensionResults();

    let prfKeyMaterial: Uint8Array | null = null;

    if (getResults?.prf?.results?.first) {
         // Cast to any to avoid strict TS ArrayBuffer/SharedArrayBuffer mismatches
        prfKeyMaterial = new Uint8Array(getResults.prf.results.first as any);
    }

    if (!prfKeyMaterial) {
        throw new Error("Authenticator does not support PRF extension. Please try again.");
    }
    
    // 4. Derive Wrapping Key
    const wrappingKey = await window.crypto.subtle.importKey(
        'raw',
        prfKeyMaterial as any,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );

    // 5. Export Master Key to string
    const masterKeyString = await exportKey(masterKey); // Base64 string

    // 6. Wrap (Encrypt) the Master Key using the Wrapping Key
    const { iv, data: encryptedKey } = await encrypt(wrappingKey, masterKeyString);

    return {
        credentialId,
        salt: saltBase64,
        encryptedKey,
        iv
    };
};

/**
 * Unlocks the Master Key using the stored Biometric Data.
 */
export const unlockBiometric = async (data: BiometricData): Promise<CryptoKey> => {
    const saltBuffer = decodeBase64(data.salt);
    const credentialIdBuffer = decodeBase64(data.credentialId);

    const assertionOptions: any = {
        publicKey: {
            challenge: window.crypto.getRandomValues(new Uint8Array(32)),
            rpId: window.location.hostname,
            allowCredentials: [{
                type: 'public-key',
                id: credentialIdBuffer
            }],
            userVerification: 'required',
            extensions: {
                prf: {
                    eval: {
                        first: saltBuffer
                    }
                }
            }
        }
    };

    // 1. Authenticate
    const assertion = await navigator.credentials.get(assertionOptions) as any;
    if (!assertion) throw new Error("Authentication failed");

    const prfResults = assertion?.getClientExtensionResults()?.prf;
    if (!prfResults || !prfResults.results || !prfResults.results.first) {
        throw new Error("Could not retrieve PRF key from authenticator.");
    }

    // 2. Re-derive Wrapping Key
    // Cast to any to avoid strict TS ArrayBuffer/SharedArrayBuffer mismatches
    const prfKeyMaterial = new Uint8Array(prfResults.results.first as any);
    const wrappingKey = await window.crypto.subtle.importKey(
        'raw',
        prfKeyMaterial as any,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );

    // 3. Unwrap Master Key
    const masterKeyString = await decrypt(wrappingKey, data.encryptedKey, data.iv);
    
    // 4. Import Master Key
    return importKey(masterKeyString);
};