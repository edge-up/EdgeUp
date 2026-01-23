import { ConsentResponse, ConsumeConsentResponse, DhanAuthConfig } from '@/types/dhan-auth';

const DHAN_AUTH_BASE = 'https://auth.dhan.co';

/**
 * Dhan OAuth Authentication Service
 * Handles the 3-step OAuth flow for API key & secret authentication
 * 
 * Flow:
 * 1. generateConsent() -> Get consentAppId
 * 2. getBrowserLoginUrl() -> User authenticates in browser
 * 3. consumeConsent(tokenId) -> Exchange for accessToken
 */
export class DhanAuthService {
    private config: DhanAuthConfig;

    constructor(config?: DhanAuthConfig) {
        this.config = config || {
            apiKey: process.env.DHAN_API_KEY || '',
            apiSecret: process.env.DHAN_API_SECRET || '',
            clientId: process.env.DHAN_CLIENT_ID || '',
            redirectUrl: process.env.DHAN_REDIRECT_URL || '',
        };

        if (!this.config.apiKey || !this.config.apiSecret || !this.config.clientId) {
            console.warn('DhanAuthService: Missing API credentials in environment');
        }
    }

    /**
     * STEP 1: Generate Consent
     * Initiates OAuth flow and returns consentAppId
     */
    async generateConsent(): Promise<ConsentResponse> {
        try {
            console.log('🔐 Step 1: Generating consent...');

            const response = await fetch(
                `${DHAN_AUTH_BASE}/app/generate-consent?client_id=${this.config.clientId}`,
                {
                    method: 'POST',
                    headers: {
                        'app_id': this.config.apiKey,
                        'app_secret': this.config.apiSecret,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Generate consent failed:', errorText);
                throw new Error(`Failed to generate consent: ${response.statusText}`);
            }

            const data: ConsentResponse = await response.json();
            console.log('✅ Consent generated:', data.consentAppId);

            return data;
        } catch (error) {
            console.error('❌ DhanAuthService.generateConsent error:', error);
            throw error;
        }
    }

    /**
     * STEP 2: Get Browser Login URL
     * Returns URL where user needs to authenticate
     */
    getBrowserLoginUrl(consentAppId: string): string {
        const loginUrl = `${DHAN_AUTH_BASE}/login/consentApp-login?consentAppId=${consentAppId}`;
        console.log('🌐 Browser login URL:', loginUrl);
        return loginUrl;
    }

    /**
     * STEP 3: Consume Consent
     * Exchanges tokenId for accessToken after user authentication
     */
    async consumeConsent(tokenId: string): Promise<ConsumeConsentResponse> {
        try {
            console.log('🔐 Step 3: Consuming consent with tokenId...');

            const response = await fetch(
                `${DHAN_AUTH_BASE}/app/consumeApp-consent?tokenId=${tokenId}`,
                {
                    method: 'GET',
                    headers: {
                        'app_id': this.config.apiKey,
                        'app_secret': this.config.apiSecret,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Consume consent failed:', errorText);
                throw new Error(`Failed to consume consent: ${response.statusText}`);
            }

            const data: ConsumeConsentResponse = await response.json();
            console.log('✅ Access token obtained for client:', data.dhanClientName);

            return data;
        } catch (error) {
            console.error('❌ DhanAuthService.consumeConsent error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token (uses same flow as initial authentication)
     * Note: Dhan OAuth doesn't have a dedicated refresh endpoint,
     * so we need to re-run the consent flow
     */
    async refreshToken(): Promise<ConsumeConsentResponse> {
        console.log('🔄 Refreshing Dhan access token...');

        // Generate new consent
        const consent = await this.generateConsent();
        const loginUrl = this.getBrowserLoginUrl(consent.consentAppId);

        // User needs to complete browser flow
        throw new Error(
            `Token refresh requires user authentication. Please visit: ${loginUrl}`
        );
    }

    /**
     * Complete OAuth flow (for programmatic use)
     * Returns login URL that user must visit
     */
    async initiateOAuthFlow(): Promise<{ consentAppId: string; loginUrl: string }> {
        const consent = await this.generateConsent();
        const loginUrl = this.getBrowserLoginUrl(consent.consentAppId);

        return {
            consentAppId: consent.consentAppId,
            loginUrl,
        };
    }
}

// Singleton instance
let authServiceInstance: DhanAuthService | null = null;

export function getDhanAuthService(): DhanAuthService {
    if (!authServiceInstance) {
        authServiceInstance = new DhanAuthService();
    }
    return authServiceInstance;
}
