# EdgeUp - NSE Intraday Momentum Analytics

A production-grade platform for identifying early-morning NSE sector momentum and qualifying F&O stocks before 9:25 AM IST.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (Upstash)
- **Auth**: NextAuth.js
- **Data Source**: Dhan API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Dhan API credentials
- Upstash Redis account

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in the required environment variables.

### Installation

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run ESLint
```

## Features

- Real-time sector momentum tracking
- F&O-eligible stock filtering
- Automatic snapshot at 09:25 AM IST
- Historical data (7 days retention)
- Multi-user authentication
- Mobile-responsive dashboard

## License

Private - All rights reserved
