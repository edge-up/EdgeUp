// Types for Dhan OAuth flow
export interface DhanAuthConfig {
    apiKey: string;
    apiSecret: string;
    clientId: string;
    redirectUrl: string;
}

export interface ConsentResponse {
    consentAppId: string;
    consentAppStatus: 'GENERATED' | 'CONSUMED' | 'EXPIRED';
    status: 'success' | 'failure';
}

export interface ConsumeConsentResponse {
    dhanClientId: string;
    dhanClientName: string;
    dhanClientUcc: string;
    givenPowerOfAttorney: boolean;
    accessToken: string;
    expiryTime: string; // ISO 8601 format
}

export interface StoredToken {
    accessToken: string;
    expiryTime: string;
    clientId: string;
    clientName?: string;
    lastRefreshed: string;
}

export interface AuthStatus {
    isAuthenticated: boolean;
    expiryTime?: string;
    clientName?: string;
    daysUntilExpiry?: number;
}
