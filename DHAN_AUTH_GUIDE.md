# Dhan API Authentication Guide

## Overview

EdgeUp uses Dhan's OAuth-based authentication with API Key & Secret for accessing market data. This guide explains how the authentication works and how to maintain it.

## Understanding Dhan Authentication

### API Key & Secret (12-month validity)
- **What**: Your app credentials from Dhan
- **Validity**: 12 months from generation
- **Location**: Stored in `.env` file
- **Purpose**: Used to generate access tokens via OAuth flow

### Access Tokens (24-hour validity)
- **What**: JWT tokens for API requests
- **Validity**: 24 hours from generation
- **Location**: Stored in `.dhan-tokens.json` (auto-managed)
- **Purpose**: Authenticate all API requests to Dhan

### Key Difference
- **API Key/Secret** = Long-term credentials (12 months)
- **Access Token** = Short-term session token (24 hours)

## Initial Setup

### 1. Generate API Key & Secret

1. Visit [web.dhan.co](https://web.dhan.co)
2. Login to your account
3. Go to **My Profile** → **Access DhanHQ APIs**
4. Toggle to **"API key"** section
5. Enter app details:
   - **App Name**: `EdgeUp Trading Platform`
   - **Redirect URL**: `http://localhost:3000/api/dhan/auth/callback` (dev) or `https://yourdomain.com/api/dhan/auth/callback` (production)
6. Save the generated **API Key** and **API Secret**

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Dhan OAuth Configuration
DHAN_CLIENT_ID="your-client-id"
DHAN_API_KEY="your-api-key-here"
DHAN_API_SECRET="your-api-secret-here"
DHAN_REDIRECT_URL="http://localhost:3000/api/dhan/auth/callback"
```

### 3. Complete OAuth Setup

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/dhan-setup`
3. Click **"Connect Dhan Account"**
4. Complete login in the popup window (enter credentials + 2FA)
5. Done! Token is saved to `.dhan-tokens.json`

## Daily Token Refresh

Since access tokens expire every 24 hours, you need to refresh them regularly.

### Option 1: Manual Refresh (Recommended for Development)

1. Visit `http://localhost:3000/admin/dhan-setup`
2. Check token status - if it shows "Refresh Recommended"
3. Click **"Reconnect"** button
4. Complete authentication in popup

### Option 2: Automated Monitoring (Production)

Set up a daily cron job to check token status:

```bash
# In vercel.json
{
  "crons": [
    {
      "path": "/api/cron/refresh-dhan-token",
      "schedule": "0 8 * * *"  // Daily at 8 AM
    }
  ]
}
```

The cron will log warnings when token needs refresh. You'll still need to manually complete the OAuth flow via `/admin/dhan-setup`.

### Option 3: Pre-Market Refresh Routine

Add this to your morning routine before market hours:

1. Open `http://localhost:3000/admin/dhan-setup`
2. Verify token is valid (green status)
3. If expired or expiring soon, click "Reconnect"

## How Token Management Works

### Automatic Token Loading

The `DhanClient` automatically loads tokens in this priority order:

1. **Stored OAuth token** (from `.dhan-tokens.json`)
2. **Environment variable** (from `.env` - fallback)

Example flow:
```typescript
// Token automatically loaded when creating client
const dhanClient = new DhanClient();

// Client checks token validity before each API call
const quotes = await dhanClient.getQuotes(['NSE_EQ_1234']);
```

### Token Validation

Before each API request, the client:
1. Checks if token exists in storage
2. Validates token hasn't expired
3. Reloads token if it was refreshed externally

### Security

- ✅ `.dhan-tokens.json` is gitignored (never committed)
- ✅ API keys stored in `.env` (also gitignored)
- ✅ OAuth flow uses Dhan's secure login page
- ✅ Tokens auto-expire for security

## Troubleshooting

### "No auth token found" error

**Cause**: No token in storage, need to authenticate

**Solution**:
1. Visit `/admin/dhan-setup`
2. Click "Connect Dhan Account"
3. Complete OAuth flow

### "Token expired" error

**Cause**: Access token is older than 24 hours

**Solution**: Same as above - reconnect via setup page

### "Failed to generate consent" error

**Cause**: Invalid or missing API key/secret

**Solution**:
1. Verify `.env` has correct `DHAN_API_KEY` and `DHAN_API_SECRET`
2. Check API key hasn't expired (max 12 months)
3. Regenerate API key from Dhan if needed

### Token shows 24 hours instead of 12 months

**Expected behavior!** 
- API Key/Secret last 12 months
- Access tokens last 24 hours
- You use the 12-month credentials to generate new 24-hour tokens as needed

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dhan/auth/generate-consent` | POST | Start OAuth flow |
| `/api/dhan/auth/callback` | GET | Handle OAuth redirect |
| `/api/dhan/auth/status` | GET | Check auth status |
| `/api/dhan/auth/status` | DELETE | Clear stored token |
| `/api/dhan/auth/refresh` | GET | Check if refresh needed |
| `/api/dhan/auth/refresh` | POST | Trigger refresh flow |
| `/api/cron/refresh-dhan-token` | GET | Cron monitor (automated) |

## File Structure

```
.dhan-tokens.json           # Access token storage (gitignored)
.env                        # API key & secret (gitignored)

src/
├── lib/dhan/
│   ├── dhan-auth.ts       # OAuth service
│   ├── dhan-client.ts     # API client with auto token loading
│   └── token-storage.ts   # Token persistence layer
├── app/
│   ├── admin/dhan-setup/  # Setup UI
│   └── api/dhan/auth/     # OAuth endpoints
```

## Best Practices

1. **Never commit tokens**: `.dhan-tokens.json` and `.env` are gitignored
2. **Check status daily**: Visit setup page before market hours
3. **Refresh proactively**: Don't wait for token to fully expire
4. **Monitor logs**: Watch for "Token needs refresh" warnings
5. **Backup API credentials**: Save API key/secret securely (password manager)

## Production Deployment

### Vercel / Similar Platforms

1. Add environment variables in dashboard:
   ```
   DHAN_CLIENT_ID=...
   DHAN_API_KEY=...
   DHAN_API_SECRET=...
   DHAN_REDIRECT_URL=https://yourdomain.com/api/dhan/auth/callback
   ```

2. Update Dhan app settings with production redirect URL

3. After deployment, visit `https://yourdomain.com/admin/dhan-setup`

4. Complete OAuth flow in production

5. Set up cron to monitor token status daily

## Questions?

- **What if I forget to refresh?** API calls will fail with 401 errors. Just reconnect via setup page.
- **Can I automate the entire refresh?** No - Dhan requires browser-based login with 2FA for security.
- **What if API key expires (12 months)?** Generate new API key from Dhan and update `.env`
- **Multiple environments?** Each environment needs its own OAuth setup with matching redirect URLs.
