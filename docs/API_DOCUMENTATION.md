# EdgeUp API Documentation

## Overview

EdgeUp provides RESTful APIs for accessing NSE sector momentum and qualifying F&O stock data. All endpoints return JSON responses.

**Base URL**: `https://your-domain.vercel.app`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Market Status](#market-status)
3. [Sectors](#sectors)
4. [Stocks](#stocks)
5. [Snapshots](#snapshots)
6. [Alerts](#alerts)
7. [Notifications](#notifications)
8. [Response Format](#response-format)
9. [Error Handling](#error-handling)

---

## Authentication

### Session-Based Auth

EdgeUp uses NextAuth.js with session-based authentication.

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

#### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Protected Endpoints

Most endpoints require authentication. Include session cookie in requests.

---

## Market Status

### Get Market Status
```http
GET /api/market-status
```

**Response**:
```json
{
  "isOpen": true,
  "isTradingDay": true,
  "reason": "Market is open",
  "nextOpen": "2026-01-21 09:15 AM"
}
```

**Fields**:
- `isOpen`: Whether market is currently open
- `isTradingDay`: Whether today is a trading day
- `reason`: Reason if market is closed
- `nextOpen`: Next market opening time

---

## Sectors

### List All Sectors
```http
GET /api/sectors
```

**Query Parameters**:
- `snapshot` (optional): Return frozen snapshot data instead of live

**Response**:
```json
{
  "success": true,
  "data": {
    "sectors": [
      {
        "id": "clx1234...",
        "name": "NIFTY IT",
        "symbol": "NIFTY_IT",
        "currentValue": 35240.50,
        "previousClose": 34800.00,
        "percentChange": 1.26,
        "direction": "UP",
        "qualifyingStockCount": 5,
        "isQualifying": true
      }
    ],
    "snapshotTime": "2026-01-20T04:00:00.000Z",
    "isFrozen": true,
    "summary": {
      "totalSectors": 8,
      "totalStocks": 23,
      "bullishSectors": 5,
      "bearishSectors": 3
    }
  }
}
```

### Get Sector Stocks
```http
GET /api/sectors/{sectorId}/stocks
```

**Response**:
```json
{
  "success": true,
  "data": {
    "qualifyingStocks": [
      {
        "id": "clx5678...",
        "symbol": "TCS",
        "name": "Tata Consultancy Services Ltd",
        "ltp": 3450.50,
        "previousClose": 3400.00,
        "percentChange": 1.48,
        "direction": "UP",
        "openInterest": 1500000,
        "previousOpenInterest": 1350000,
        "oiChangePercent": 11.11,
        "volume": 2500000
      }
    ],
    "watchlistStocks": [
      {
        "symbol": "INFY",
        "percentChange": 1.2,
        "oiChangePercent": 8.5
      }
    ]
  }
}
```

---

## Stocks

### Get Stock Details
```http
GET /api/stocks/{symbol}
```

**Example**: `GET /api/stocks/TCS`

**Response**:
```json
{
  "success": true,
  "data": {
    "stock": {
      "symbol": "TCS",
      "name": "Tata Consultancy Services Ltd",
      "ltp": 3450.50,
      "previousClose": 3400.00,
      "percentChange": 1.48,
      "open": 3420.00,
      "high": 3460.00,
      "low": 3410.00,
      "volume": 2500000,
      "openInterest": 1500000,
      "oiChangePercent": 11.11
    },
    "ohlc": [
      {
        "timestamp": "2026-01-20T09:15:00Z",
        "open": 3420.00,
        "high": 3425.00,
        "low": 3415.00,
        "close": 3422.00,
        "volume": 150000
      }
    ],
    "oiHistory": [
      {
        "timestamp": "2026-01-20T09:15:00Z",
        "openInterest": 1450000
      }
    ]
  }
}
```

---

## Snapshots

### List Snapshots
```http
GET /api/snapshots
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx9012...",
      "tradingDate": "2026-01-20",
      "snapshotTime": "2026-01-20T04:00:00Z",
      "totalSectors": 8,
      "totalStocks": 23,
      "bullishSectors": 5,
      "bearishSectors": 3
    }
  ]
}
```

### Get Snapshot by Date
```http
GET /api/snapshots/{date}
```

**Example**: `GET /api/snapshots/2026-01-20`

**Response**:
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "id": "clx9012...",
      "tradingDate": "2026-01-20",
      "snapshotTime": "2026-01-20T04:00:00Z"
    },
    "sectors": [
      {
        "id": "clx1234...",
        "name": "NIFTY IT",
        "percentChange": 1.26,
        "qualifyingStocks": 5
      }
    ],
    "stocks": [
      {
        "symbol": "TCS",
        "sectorName": "NIFTY IT",
        "percentChange": 1.48,
        "oiChangePercent": 11.11
      }
    ]
  }
}
```

### Get Latest Snapshot
```http
GET /api/snapshot/latest
```

Returns the most recent completed snapshot.

---

## Alerts

### List User Alerts
```http
GET /api/alerts
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx3456...",
      "type": "SECTOR_QUALIFYING",
      "targetType": "SECTOR",
      "targetId": "clx1234...",
      "isActive": true,
      "createdAt": "2026-01-18T10:30:00Z",
      "target": {
        "name": "NIFTY IT",
        "symbol": "NIFTY_IT"
      }
    }
  ]
}
```

### Create Alert
```http
POST /api/alerts
Content-Type: application/json

{
  "type": "SECTOR_QUALIFYING",
  "targetType": "SECTOR",
  "targetId": "clx1234..."
}
```

**Alert Types**:
- `SECTOR_QUALIFYING`: Sector moves ≥1%
- `STOCK_BREAKOUT`: Stock breaks out with OI surge
- `DAILY_SUMMARY`: Daily snapshot summary

**Target Types**:
- `SECTOR`: For sector alerts
- `STOCK`: For stock alerts

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clx3456...",
    "type": "SECTOR_QUALIFYING",
    "targetType": "SECTOR",
    "targetId": "clx1234...",
    "isActive": true
  }
}
```

### Toggle Alert Status
```http
PATCH /api/alerts/{alertId}
Content-Type: application/json

{
  "isActive": false
}
```

### Delete Alert
```http
DELETE /api/alerts/{alertId}
```

---

## Notifications

### List Notifications
```http
GET /api/notifications?limit=10
```

**Query Parameters**:
- `limit` (optional): Max notifications to return (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "clx7890...",
        "title": "🎯 Sector Alert Triggered",
        "message": "NIFTY IT is now qualifying with +1.26% move",
        "type": "SECTOR_ALERT",
        "isRead": false,
        "createdAt": "2026-01-20T04:00:30Z"
      }
    ],
    "unreadCount": 3
  }
}
```

### Mark as Read
```http
PATCH /api/notifications
Content-Type: application/json

{
  "markAll": true
}
```

Or mark specific notification:
```json
{
  "notificationId": "clx7890..."
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Errors

#### Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### Invalid Input
```json
{
  "success": false,
  "error": "Invalid alert type"
}
```

#### Not Found
```json
{
  "success": false,
  "error": "Snapshot not found for date: 2026-01-25"
}
```

---

## Rate Limiting

- **Dhan API**: 1 request/second for quote APIs
- **Retry Logic**: 3 attempts with exponential backoff
- **Caching**: 
  - Live data: 30s TTL
  - Snapshot data: 24h TTL

---

## Caching

### Cache Headers

**API Responses**:
```
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

**Static Assets**:
```
Cache-Control: public, max-age=31536000, immutable
```

### Cache Stats (Admin Only)
```http
GET /api/cache/stats
```

**Response**:
```json
{
  "stats": {
    "memory": {
      "hits": 450,
      "misses": 50,
      "hitRate": "90.0%",
      "size": 123,
      "maxSize": 500
    },
    "redis": "connected"
  }
}
```

---

## Webhooks (Coming Soon)

Future plans include webhooks for:
- Snapshot creation
- Alert triggers
- Market open/close events

---

## SDK Examples

### JavaScript/TypeScript
```typescript
// Fetch qualifying sectors
const response = await fetch('/api/sectors');
const { data } = await response.json();

// Create alert
const alert = await fetch('/api/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'SECTOR_QUALIFYING',
    targetType: 'SECTOR',
    targetId: sectorId
  })
});
```

### Python
```python
import requests

# Get market status
response = requests.get('https://edgeup.com/api/market-status')
data = response.json()

# Create alert
alert_data = {
    'type': 'STOCK_BREAKOUT',
    'targetType': 'STOCK',
    'targetId': stock_id
}
response = requests.post(
    'https://edgeup.com/api/alerts',
    json=alert_data,
    cookies=session_cookies
)
```

---

## Support

For API support or bug reports:
- **GitHub Issues**: https://github.com/edge-up/EdgeUp/issues
- **Email**: api@edgeup.com

---

**Version**: 1.0.0  
**Last Updated**: January 2026
