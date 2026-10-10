import { encodeBase64, decodeBase64, importKey, exportKey, encrypt, decrypt } from './crypto';
import { BiometricData } from '../types';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, AccessControl } from '@capgo/capacitor-native-biometric';

/**
 * This library handles the WebAuthn PRF (Pseudo-Random Function) extension.
 * It allows us to securely "wrap" the encryption key using the device's authenticator
 * (TouchID/FaceID) without the key ever leaving the device or being stored in plaintext.
 *
 * For Capacitor (Native Android/iOS apps), it uses NativeBiometric with Keystore binding.
 */

const IS_WEB_SUPPORTED = typeof PublicKeyCredential !== 'undefined' && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

export const isBiometricSupported = async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
        try {
            const result = await NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch (err) {
            console.error("NativeBiometric isAvailable error:", err);
            return false;
        }
    }

    if (!IS_WEB_SUPPORTED) return false;
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
 * Registers a new WebAuthn credential with the PRF extension enabled, OR
 * Stores the master key securely in native keystore.
 */
export const registerBiometric = async (masterKey: CryptoKey, userId: string): Promise<BiometricData> => {
    // 5. Export Master Key to string
    const masterKeyString = await exportKey(masterKey); // Base64 string

    if (Capacitor.isNativePlatform()) {
        const supported = await isBiometricSupported();
        if (!supported) throw new Error("Native biometrics not available on this device.");

        try {
            // We use setSecureData to securely store the master key tied to biometrics.
            await NativeBiometric.setData({
                key: `diary_master_key_${userId}`,
                value: masterKeyString,
                accessControl: AccessControl.BIOMETRY_ANY,
                title: 'Protect Master Key',

            });
            // Return a mock BiometricData object that signifies it's a native biometric registration
            return {
                credentialId: 'native-biometric',
                salt: 'native-biometric',
                encryptedKey: 'native-biometric',
                iv: 'native-biometric',
            };
        } catch (err) {
            console.error("Failed to setup native biometrics:", err);
            throw err;
        }
    }

    if (!IS_WEB_SUPPORTED) throw new Error("WebAuthn not supported");

    // 1. Generate Salt and Challenge
    const saltBuffer = window.crypto.getRandomValues(new Uint8Array(32));
    const saltBase64 = encodeBase64(saltBuffer.buffer);
    
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const id = strToBin(userId); // User ID handle

    // 2. Step A: Create Credential
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
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                residentKey: 'required',
                requireResidentKey: true
            },
            timeout: 60000,
            extensions: {
                prf: {
                    eval: {
                        first: saltBuffer
                    }
                }
            }
        }
    };

    const credential = await navigator.credentials.create(creationOptions) as any;
    if (!credential) throw new Error("Failed to create credential");

    const credentialId = encodeBase64(credential.rawId);
    
    let prfKeyMaterial: Uint8Array | null = null;
    
    const createResults = credential.getClientExtensionResults();
    if (createResults?.prf?.results?.first) {
         prfKeyMaterial = new Uint8Array(createResults.prf.results.first as any);
    } else {
        // 3. Step B: Assert (Login) to get the PRF Key
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

        if (getResults?.prf?.results?.first) {
            prfKeyMaterial = new Uint8Array(getResults.prf.results.first as any);
        }
    }

    if (!prfKeyMaterial) {
        throw new Error("Authenticator does not support PRF extension. Please ensure your device and browser support WebAuthn PRF.");
    }
    
    // 4. Derive Wrapping Key
    const wrappingKey = await window.crypto.subtle.importKey(
        'raw',
        prfKeyMaterial as any,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );

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
 * Unlocks the Master Key using the stored Biometric Data or NativeBiometric.
 */
export const unlockBiometric = async (data: BiometricData, userId: string): Promise<CryptoKey> => {
    if (Capacitor.isNativePlatform() && data.credentialId === 'native-biometric') {
        try {
            const result = await NativeBiometric.getSecureData({
                key: `diary_master_key_${userId}`,
                title: 'Unlock Diary',

                negativeButtonText: 'Use Password'
            });
            return importKey(result.value);
        } catch (err: any) {
            console.error("NativeBiometric getSecureData failed:", err);
            if (err.code === "21") {
                throw new Error("No biometric key found. Please re-enroll biometrics.");
            }
            throw new Error("Biometric authentication failed.");
        }
    }

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
