# Dhan Token Management Without Extra Cron Jobs

## Problem
- Vercel free tier allows only **2 cron jobs**
- Both slots already used:
  - `/api/cron/update-oi` (1 AM Mon-Fri)
  - `/api/cron/ingest` (4 AM Mon-Fri)
- Dhan access tokens expire every 24 hours
- Need to monitor and remind user to refresh

## Solution: Multi-Layer Approach

### ✅ Layer 1: Dashboard Warning Banner (Primary)

**Location**: `/src/components/dashboard/DhanTokenWarning.tsx`

**How it works**:
- Checks token status on every dashboard visit
- Shows persistent banner at top when token needs refresh
- Color-coded urgency:
  - 🟡 Yellow: < 12 hours remaining
  - 🔴 Red: < 6 hours remaining
- One-click "Refresh Token" button → redirects to `/admin/dhan-setup`

**Advantages**:
- ✅ No cron needed
- ✅ User sees warning immediately when they open dashboard
- ✅ Can't miss it - banner is at the top
- ✅ Most users check dashboard before market hours anyway

**Code**:
```tsx
// Automatically added to dashboard layout
<DhanTokenWarning /> // Shows when token.hoursUntilExpiry < 12
```

### ✅ Layer 2: Piggyback on Existing Cron (Secondary)

**Location**: `/src/app/api/cron/update-oi/route.ts`

**How it works**:
- The existing `update-oi` cron (runs daily at 1 AM) now also checks Dhan token
- Logs warnings to Vercel logs when token needs refresh
- No extra cron slot needed - consolidated into existing job

**Advantages**:
- ✅ Automated daily check
- ✅ Shows in Vercel logs for debugging
- ✅ Zero extra cost or cron slots

**Code added**:
```typescript
// After OI update completes:
const tokenStatus = await fetch('/api/dhan/auth/refresh').then(r => r.json());
if (tokenStatus.needsRefresh) {
  console.warn(`⚠️ Token expires in ${tokenStatus.hoursUntilExpiry} hours`);
}
```

### ✅ Layer 3: Manual Status Check (On-Demand)

**Endpoints**:
- `GET /api/dhan/auth/status` - Full auth details
- `GET /api/dhan/auth/refresh` - Check if refresh needed

**Usage**:
```bash
# Quick check from terminal
curl http://localhost:3000/api/dhan/auth/refresh

# Response when needs refresh:
{
  "needsRefresh": true,
  "hoursUntilExpiry": 8,
  "message": "Token needs refresh within 12 hours"
}
```

---

## Daily Workflow

### Typical User Journey

**Morning (Pre-Market)**:
1. User opens `http://localhost:3000/dashboard`
2. **If token is expiring**:
   - 🟡/🔴 Banner appears at top: "Dhan API Token Expires Soon"
   - User clicks "Refresh Token" button
   - Redirected to `/admin/dhan-setup`
   - Clicks "Reconnect" → Popup → Login → Done (5 seconds)
3. **If token is valid**:
   - No banner shown
   - Dashboard loads normally
   - Start trading!

**Behind the scenes (Automatic)**:
- 1:00 AM: Cron runs OI update + checks Dhan token status
- Logs to Vercel: "✅ Token valid for 23 hours" or "⚠️ Token needs refresh!"

---

## Why This Approach is Optimal

| Alternative | Pros | Cons | Verdict |
|------------|------|------|---------|
| **Dedicated Dhan Token Cron** | Automated daily check | Wastes 1 cron slot, can't auto-fix (OAuth needs browser) | ❌ Not worth it |
| **Email Notifications** | Gets user's attention | Requires email service setup, delays awareness | ⚠️ Overkill |
| **Browser Notifications** | Native browser alerts | Requires permission, many users block | ⚠️ Unreliable |
| **Dashboard Banner (Our choice)** | Zero cost, instant visibility, one-click fix | User must open dashboard | ✅ **Best** |
| **Piggyback existing cron** | Free monitoring, shows in logs | Can't alert user in real-time | ✅ **Good supplement** |

---

## Implementation Checklist

- [x] Create `DhanTokenWarning` component
- [x] Add to dashboard layout
- [x] Add token check to `update-oi` cron
- [x] Create `/api/dhan/auth/refresh` endpoint
- [x] Update `DHAN_AUTH_GUIDE.md` with daily workflow
- [ ] Optional: Add email alert to cron (if SMTP configured)

---

## Future Enhancements (Optional)

### 1. Email Alert Integration (if needed)

Add to `update-oi` cron when token needs refresh:

```typescript
if (tokenStatus.needsRefresh && tokenStatus.hoursUntilExpiry < 6) {
  // Send email to admin
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject
: 'Dhan API Token Expires Soon',
    body: `Your Dhan token expires in ${tokenStatus.hoursUntilExpiry} hours. Please refresh at /admin/dhan-setup`
  });
}
```

### 2. Slack/Discord Webhook

```typescript
if (tokenStatus.needsRefresh) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Dhan token expires in ${tokenStatus.hoursUntilExpiry} hours!`
    })
  });
}
```

### 3. Browser Push Notifications

Add service worker for PWA and send push when user is subscribed.

---

## Testing the Setup

### 1. Test Dashboard Banner

```bash
# Start dev server
npm run dev

# Visit dashboard
open http://localhost:3000/dashboard

# Should see banner if token < 12 hours
```

### 2. Test Cron Integration

```bash
# Manually trigger cron (with auth)
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/update-oi

# Check logs for:
# "✅ [DHAN AUTH] Token valid for X hours"
```

### 3. Simulate Expiry

Manually edit `.dhan-tokens.json`:
```json
{
  "expiryTime": "2026-01-23T15:00:00"  // Set to near future
}
```

Refresh dashboard → Should see red banner!

---

## Monitoring in Production

### Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by "DHAN AUTH"
3. Look for warnings:
   - ✅ `[DHAN AUTH] Token valid for X hours`
   - ⚠️ `[DHAN AUTH] Token needs refresh!`
   - ❌ `[DHAN AUTH] No valid token found!`

### Quick Status Check

```bash
# Production
curl https://yourdomain.com/api/dhan/auth/refresh

# Development
curl http://localhost:3000/api/dhan/auth/refresh
```

---

## Summary

**You now have a complete token management system without using extra cron slots:**

1. **Dashboard Banner** - Primary user-facing alert
2. **Piggybacked Cron** - Automated logging for admin monitoring  
3. **Manual Endpoints** - On-demand status checks

**User Experience**:
- Open dashboard → See banner if needed → One click to refresh → Done!

**Zero extra cost, maximum convenience!** 🎉
