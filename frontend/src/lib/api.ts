/**
 * Centralized API client for SecondLife Commerce.
 */
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
const AWS_API_BASE = import.meta.env.VITE_AWS_API_URL || '';

export function getApiBase(): string {
  return API_BASE.replace(/\/$/, '');
}

export function getAwsApiBase(): string {
  return AWS_API_BASE.replace(/\/$/, '');
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBase()}${path}`, { ...options, headers });
}

export const endpoints = {
  catalog: '/catalog',
  sellerMetrics: (sellerId: string) => `/seller/metrics?seller_id=${sellerId}`,
  userMetrics: (userId: string) => `/user/metrics?user_id=${userId}`,
  friction: '/api/v1/ml/friction/evaluate',
  triage: '/api/v1/ml/triage',
  vtoGenerate: '/api/vto/generate',
  vtoDrape: '/api/v1/ml/vto/drape',
  trustScore: (userId: string) => `/api/v1/ml/fraud/trust-score/${userId}`,
  fraudGraphRag: '/api/v1/ml/fraud-graphrag',
  health: '/health',
} as const;
