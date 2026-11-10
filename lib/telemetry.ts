// lib/telemetry.ts
// Privacy-preserving, zero-PII client crash and error telemetry.
// Strictly strips ciphertexts, encryption keys, tokens, emails, and personal identifiers.

export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  stack?: string;
  source?: string;
  appVersion: string;
  platform: string;
  isOnline: boolean;
  context?: Record<string, any>;
}

const STORAGE_KEY = 'diary_telemetry_events';
const MAX_EVENTS = 50;

/**
 * Regex patterns to scrub sensitive data before it is recorded or transmitted.
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const BEARER_REGEX = /Bearer\s+[a-zA-Z0-9._~+/-]+=*/gi;
const BASE64_CIPHERTEXT_REGEX = /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;

const SENSITIVE_KEYS = new Set([
  'password',
  'key',
  'rawkey',
  'masterkey',
  'masterpassword',
  'salt',
  'key_check_value',
  'key_check_iv',
  'iv',
  'token',
  'authorization',
  'apikey',
  'secret',
  'encrypted_entry',
  'encrypteddata'
]);

/**
 * Deeply scrubs PII, secrets, and cryptographic material from an object or string.
 */
export function scrubPII(input: any): any {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return input
      .replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
      .replace(JWT_REGEX, '[REDACTED_JWT]')
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(BASE64_CIPHERTEXT_REGEX, '[REDACTED_CIPHERTEXT]');
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(scrubPII);
  }

  if (typeof input === 'object') {
    const scrubbed: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        scrubbed[key] = '[REDACTED_SECRET]';
      } else {
        scrubbed[key] = scrubPII(value);
      }
    }
    return scrubbed;
  }

  return String(input);
}

/**
 * Saves a scrubbed diagnostic event to sessionStorage.
 */
function recordEvent(event: DiagnosticEvent): void {
  try {
    if (typeof sessionStorage === 'undefined') return;

    const existing = sessionStorage.getItem(STORAGE_KEY);
    const events: DiagnosticEvent[] = existing ? JSON.parse(existing) : [];

    events.unshift(event);
    if (events.length > MAX_EVENTS) {
      events.length = MAX_EVENTS;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    // Telemetry must never crash the host application
    console.warn('[Telemetry] Failed to persist event to sessionStorage:', err);
  }
}

/**
 * Record an exception with strict sanitization.
 */
export function captureException(error: any, context?: Record<string, any>): void {
  try {
    const rawMessage = error?.message || (typeof error === 'string' ? error : 'Unknown Exception');
    const rawStack = error?.stack || '';

    const scrubbedMessage = scrubPII(rawMessage);
    const scrubbedStack = scrubPII(rawStack);
    const scrubbedContext = context ? scrubPII(context) : undefined;

    const diagnostic: DiagnosticEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: scrubbedMessage,
      stack: scrubbedStack,
      source: context?.source || 'client_runtime',
      appVersion: (import.meta as any).env?.VITE_APP_VERSION || '1.0.8',
      platform: typeof navigator !== 'undefined' ? navigator.platform || 'web' : 'unknown',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      context: scrubbedContext
    };

    console.error(`[Telemetry Scrubbed Exception]`, diagnostic);
    recordEvent(diagnostic);

    // If an external Sentry/OpenTelemetry endpoint is configured, forward cleanly
    sendToExternalEndpoint(diagnostic);
  } catch (err) {
    console.warn('[Telemetry] captureException internal error:', err);
  }
}

/**
 * Record an informational or warning telemetry message.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context?: Record<string, any>
): void {
  try {
    const diagnostic: DiagnosticEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message: scrubPII(message),
      source: context?.source || 'application',
      appVersion: (import.meta as any).env?.VITE_APP_VERSION || '1.0.8',
      platform: typeof navigator !== 'undefined' ? navigator.platform || 'web' : 'unknown',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      context: context ? scrubPII(context) : undefined
    };

    if (level === 'warn') {
      console.warn(`[Telemetry Scrubbed Warn]`, diagnostic);
    } else {
      console.log(`[Telemetry Scrubbed Info]`, diagnostic);
    }

    recordEvent(diagnostic);
    if (level === 'error' || level === 'warn') {
      sendToExternalEndpoint(diagnostic);
    }
  } catch (err) {
    console.warn('[Telemetry] captureMessage internal error:', err);
  }
}

/**
 * Optional external forwarder if VITE_TELEMETRY_ENDPOINT is supplied.
 */
function sendToExternalEndpoint(event: DiagnosticEvent): void {
  const endpoint = (import.meta as any).env?.VITE_TELEMETRY_ENDPOINT;
  if (!endpoint || typeof fetch === 'undefined') return;

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true
    }).catch(() => {
      // Ignore background network telemetry failures
    });
  } catch (_e) {
    // Ignore telemetry recording failures
  }
}

/**
 * Retrieve recent anonymized crash and warning events for support / diagnostics.
 */
export function getAnonymizedDiagnostics(): DiagnosticEvent[] {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const existing = sessionStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clear stored telemetry.
 */
export function clearDiagnostics(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (_e) {
    // Ignore storage clear failure
  }
}

/**
 * Initialize global unhandled error and promise rejection listeners.
 */
export function initTelemetry(): void {
  if (typeof window === 'undefined') return;

  // Unhandled error listener
  window.addEventListener('error', (event: ErrorEvent) => {
    captureException(event.error || event.message, {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Unhandled promise rejection listener
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    captureException(event.reason, {
      source: 'window.unhandledrejection'
    });
  });

  captureMessage('Telemetry initialized with strict zero-PII scrubbing', 'info');
}
