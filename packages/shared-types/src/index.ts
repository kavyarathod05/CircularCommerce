/**
 * Shared API contracts between commerce-web and the API gateway.
 * Keep in sync with backend Pydantic models in services/api.
 */

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  green_credits?: number;
  co2_saved_kg?: number;
}

export interface ListingRecord {
  listingId: string;
  productId: string;
  msrp: number;
  currentPrice?: number;
  discountApplied?: string | number;
  isFlashDeal?: boolean;
  certificateUrl?: string;
  image?: string;
  owner: string;
  grade: string;
  escrowStatus: string;
  status: string;
  gs1?: {
    gtin: string;
    brand: string;
    ledgerHash: string;
    verified: boolean;
  };
}

export interface SellerMetrics {
  warehouse_avoidance_rate: number;
  co2_saved_kg: number;
  trees_planted: number;
  capital_recovery_value: number;
  escrow_locked_funds: number;
  listings_active?: number;
  returns_intercepted?: number;
  data_source?: string;
}

export interface TriageResult {
  pathway: string;
  calculated_grade: string;
  routing_reason: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
