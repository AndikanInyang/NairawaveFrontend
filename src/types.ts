// Global API envelope — every response from your backend wraps in this
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Make it globally available
declare global {
  type ApiEnvelope<T> = import('./types').ApiEnvelope<T>;
}