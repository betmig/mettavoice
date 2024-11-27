export const WELLSAID_CONFIG = {
  API_BASE_URL: 'https://api.wellsaidlabs.com',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  ERROR_MESSAGES: {
    NETWORK: 'Unable to connect to WellSaid API. Please check your internet connection.',
    AUTH: 'Invalid API key. Please check your credentials.',
    RATE_LIMIT: 'Too many requests. Please try again later.',
    SERVER: 'WellSaid API server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    UNKNOWN: 'An unexpected error occurred. Please try again.'
  }
} as const;