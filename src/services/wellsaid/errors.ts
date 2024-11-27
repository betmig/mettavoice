export class WellSaidError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WellSaidError';
  }
}

export class WellSaidNetworkError extends WellSaidError {
  constructor(message: string = 'Network error occurred while connecting to WellSaid API') {
    super(message);
    this.name = 'WellSaidNetworkError';
  }
}

export class WellSaidAuthError extends WellSaidError {
  constructor(message: string = 'Invalid API key or authentication failed') {
    super(message, 401);
    this.name = 'WellSaidAuthError';
  }
}

export class WellSaidRateLimitError extends WellSaidError {
  constructor(message: string = 'Rate limit exceeded. Please try again later') {
    super(message, 429);
    this.name = 'WellSaidRateLimitError';
  }
}

export class WellSaidServerError extends WellSaidError {
  constructor(message: string = 'WellSaid API server error') {
    super(message, 500);
    this.name = 'WellSaidServerError';
  }
}