# EdgeUp - Database Seed Guide

## What's in the Seed Script?

The `prisma/seed.ts` contains **real NSE data (January 2026)**:

### ✅ Included Data

| Category | Count | Details |
|----------|-------|---------|
| **Sectors** | 8 | NIFTY BANK, IT, PHARMA, AUTO, METAL, FMCG, FIN SERVICES, ENERGY |
| **NIFTY BANK** | 14 stocks | All current constituents post-2026 rebalancing |
| **NIFTY IT** | 10 stocks | TCS, Infosys, HCL, Wipro, LTIM, etc. |
| **Other F&O Stocks** | 20 stocks | Auto, Pharma, Metal, FMCG, Energy sectors |
| **Total F&O Stocks** | 44 | With real lot sizes and ISINs |
| **Trading Holidays** | 13 days | NSE 2026 official holidays |

---

## Prerequisites

1. **Database URL** - Add to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:port/dbname"
   ```

2. **Push Schema**:
   ```bash
   npx prisma db push
   ```

---

## Running the Seed

### Option 1: Using npm script (recommended)
```bash
npm run db:seed
```

### Option 2: Using Prisma directly
```bash
npx prisma db seed
```

### Option 3: Direct execution
```bash
npx tsx prisma/seed.ts
```

---

## Expected Output

```
🌱 Starting seed...
📊 Seeding sectors...
✅ Created 8 sectors
🏦 Seeding NIFTY BANK stocks...
✅ Created 14 NIFTY BANK stocks
💻 Seeding NIFTY IT stocks...
✅ Created 10 NIFTY IT stocks
📈 Seeding additional F&O stocks...
✅ Created 20 additional F&O stocks
📅 Seeding trading calendar...
✅ Created 13 trading holidays
✨ Seed complete!

📊 Summary:
   - 8 sectors
   - 44 F&O stocks
   - 13 trading holidays
```

---

## Sample Data

### NIFTY BANK (14 stocks)
- HDFC Bank, ICICI Bank, SBI, Kotak Mahindra
- Axis Bank, IndusInd Bank, AU Small Finance Bank
- IDFC First Bank, Federal Bank, Canara Bank
- Bank of Baroda, PNB, Union Bank, Yes Bank

### NIFTY IT (10 stocks)
- TCS, Infosys, HCL Tech, Wipro
- LTIMindtree, Tech Mahindra, Mphasis
- Coforge, Persistent Systems, OFSS

### F&O Details
- Real lot sizes (e.g., HDFCBANK: 550, TCS: 125)
- Actual ISINs for all stocks
- Industry classifications

---

## Troubleshooting

**Error: Database not found**
```bash
# Create the database first
npx prisma db push
```

**Error: Unique constraint violation**
```bash
# Seed is idempotent - safe to run multiple times
# It will upsert existing records
```

**Error: Connection refused**
```bash
# Check DATABASE_URL in .env.local
# Ensure PostgreSQL is running
```

---

## Next Steps

After seeding:
1. ✅ Verify data: `npx prisma studio`
2. 🔑 Add Dhan API credentials to `.env.local`
3. 🚀 Start dev server: `npm run dev`
4. 📱 Test the dashboard at http://localhost:3000
