/**
 * Centralized API configuration and error handling for Meeting Prep Agent
 */

export type ApiMode = 'mock' | 'real';

const STORAGE_KEY_API_MODE = 'meeting_prep_api_mode';
const STORAGE_KEY_API_BASE_URL = 'meeting_prep_api_base_url';

// Default backend API URL. Reads from Vite environment variable or defaults to port 5000
export const DEFAULT_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:5000';

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in API config listener', e);
    }
  });
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly endpoint: string;
  public readonly method: string;
  public readonly isNetworkError: boolean;
  public readonly isResponseMismatch: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      endpoint: string;
      method: string;
      isNetworkError?: boolean;
      isResponseMismatch?: boolean;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.method = options.method;
    this.isNetworkError = !!options.isNetworkError;
    this.isResponseMismatch = !!options.isResponseMismatch;
    this.details = options.details;
  }
}

// Default mode is 'real' per architecture requirements
let inMemoryMode: ApiMode = 'real';
let inMemoryBaseUrl: string = DEFAULT_API_BASE_URL;

/**
 * Get current API mode ('mock' | 'real') - Defaults to 'real'
 */
export function getApiMode(): ApiMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_API_MODE);
      if (stored === 'real' || stored === 'mock') {
        return stored;
      }
    }
  } catch (e) {
    console.warn('Failed to read API mode from localStorage', e);
  }
  return inMemoryMode;
}

/**
 * Set current API mode ('mock' | 'real')
 */
export function setApiMode(mode: ApiMode): void {
  inMemoryMode = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_API_MODE, mode);
    }
  } catch (e) {
    console.warn('Failed to save API mode to localStorage', e);
  }
  notifyListeners();
}

/**
 * Get current API Base URL
 */
export function getApiBaseUrl(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_API_BASE_URL);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    }
  } catch (e) {
    console.warn('Failed to read API base URL from localStorage', e);
  }
  return inMemoryBaseUrl;
}

/**
 * Set current API Base URL
 */
export function setApiBaseUrl(url: string): void {
  inMemoryBaseUrl = url.trim();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_API_BASE_URL, url.trim());
    }
  } catch (e) {
    console.warn('Failed to save API base URL to localStorage', e);
  }
  notifyListeners();
}

/**
 * Reset API configuration to defaults
 */
export function resetApiConfig(): void {
  inMemoryMode = 'real';
  inMemoryBaseUrl = DEFAULT_API_BASE_URL;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_API_MODE);
      localStorage.removeItem(STORAGE_KEY_API_BASE_URL);
    }
  } catch (e) {
    console.warn('Failed to reset API config in localStorage', e);
  }
  notifyListeners();
}

/**
 * Subscribe to API configuration changes
 */
export function subscribeApiConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
