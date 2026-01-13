import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * EdgeUp Seed Script - Real NSE Data (January 2026)
 * Seeds database with:
 * - NSE Sector Indices
 * - Real stock constituents
 * - F&O eligible stocks with lot sizes
 * - NSE trading calendar (2026 holidays)
 */

async function main() {
    console.log('🌱 Starting seed...');

    // ================================
    // SECTORS
    // ================================
    console.log('📊 Seeding sectors...');

    const sectors = await prisma.$transaction([
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_BANK' },
            update: {},
            create: {
                name: 'NIFTY BANK',
                symbol: 'NIFTY_BANK',
                description: 'Banking sector index - 14 most liquid banking stocks',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_IT' },
            update: {},
            create: {
                name: 'NIFTY IT',
                symbol: 'NIFTY_IT',
                description: 'Information Technology sector index - Top 10 IT companies',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_PHARMA' },
            update: {},
            create: {
                name: 'NIFTY PHARMA',
                symbol: 'NIFTY_PHARMA',
                description: 'Pharmaceutical sector index',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_AUTO' },
            update: {},
            create: {
                name: 'NIFTY AUTO',
                symbol: 'NIFTY_AUTO',
                description: 'Automobile sector index',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_METAL' },
            update: {},
            create: {
                name: 'NIFTY METAL',
                symbol: 'NIFTY_METAL',
                description: 'Metal & Mining sector index',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_FMCG' },
            update: {},
            create: {
                name: 'NIFTY FMCG',
                symbol: 'NIFTY_FMCG',
                description: 'Fast Moving Consumer Goods sector',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_FIN_SERVICE' },
            update: {},
            create: {
                name: 'NIFTY FINANCIAL SERVICES',
                symbol: 'NIFTY_FIN_SERVICE',
                description: 'Financial Services sector index',
                isActive: true,
            },
        }),
        prisma.sector.upsert({
            where: { symbol: 'NIFTY_ENERGY' },
            update: {},
            create: {
                name: 'NIFTY ENERGY',
                symbol: 'NIFTY_ENERGY',
                description: 'Energy sector index',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${sectors.length} sectors`);

    // ================================
    // STOCKS - NIFTY BANK (14 stocks as per 2026 rebalancing)
    // ================================
    console.log('🏦 Seeding NIFTY BANK stocks...');

    const bankStocks = [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', isin: 'INE040A01034', lotSize: 550 },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', isin: 'INE090A01021', lotSize: 1100 },
        { symbol: 'SBIN', name: 'State Bank of India', isin: 'INE062A01020', lotSize: 1500 },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', isin: 'INE237A01028', lotSize: 400 },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', isin: 'INE238A01034', lotSize: 1200 },
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', isin: 'INE095A01012', lotSize: 900 },
        { symbol: 'AUBANK', name: 'AU Small Finance Bank Ltd', isin: 'INE949L01017', lotSize: 1800 },
        { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', isin: 'INE092T01019', lotSize: 10000 },
        { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', isin: 'INE171A01029', lotSize: 4000 },
        { symbol: 'CANBK', name: 'Canara Bank', isin: 'INE476A01022', lotSize: 8500 },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', isin: 'INE028A01039', lotSize: 5200 },
        { symbol: 'PNB', name: 'Punjab National Bank', isin: 'INE160A01022', lotSize: 15000 },
        { symbol: 'UNIONBANK', name: 'Union Bank of India', isin: 'INE692A01016', lotSize: 6600 },
        { symbol: 'YESBANK', name: 'Yes Bank Ltd', isin: 'INE528G01035', lotSize: 38000 },
    ];

    const niftyBank = sectors.find((s: any) => s.symbol === 'NIFTY_BANK')!;

    for (const stockData of bankStocks) {
        const stock = await prisma.stock.upsert({
            where: { symbol: stockData.symbol },
            update: { isFOEligible: true, lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                name: stockData.name,
                isin: stockData.isin,
                isFOEligible: true,
                lotSize: stockData.lotSize,
                industry: 'Banking',
                isActive: true,
            },
        });

        await prisma.sectorConstituent.upsert({
            where: { sectorId_stockId: { sectorId: niftyBank.id, stockId: stock.id } },
            update: {},
            create: { sectorId: niftyBank.id, stockId: stock.id },
        });

        // Add to F&O Master
        await prisma.fOMaster.upsert({
            where: { symbol: stockData.symbol },
            update: { lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                lotSize: stockData.lotSize,
                tickSize: 0.05,
                isActive: true,
            },
        });
    }

    console.log(`✅ Created ${bankStocks.length} NIFTY BANK stocks`);

    // ================================
    // STOCKS - NIFTY IT (10 stocks)
    // ================================
    console.log('💻 Seeding NIFTY IT stocks...');

    const itStocks = [
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', isin: 'INE467B01029', lotSize: 125 },
        { symbol: 'INFY', name: 'Infosys Ltd', isin: 'INE009A01021', lotSize: 300 },
        { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', isin: 'INE860A01027', lotSize: 350 },
        { symbol: 'WIPRO', name: 'Wipro Ltd', isin: 'INE075A01022', lotSize: 1200 },
        { symbol: 'LTIM', name: 'LTIMindtree Ltd', isin: 'INE214T01019', lotSize: 150 },
        { symbol: 'TECHM', name: 'Tech Mahindra Ltd', isin: 'INE669C01036', lotSize: 550 },
        { symbol: 'MPHASIS', name: 'Mphasis Ltd', isin: 'INE356A01018', lotSize: 250 },
        { symbol: 'COFORGE', name: 'Coforge Ltd', isin: 'INE591G01017', lotSize: 100 },
        { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', isin: 'INE262H01013', lotSize: 125 },
        { symbol: 'OFSS', name: 'Oracle Financial Services Software Ltd', isin: 'INE881D01027', lotSize: 125 },
    ];

    const niftyIT = sectors.find((s: any) => s.symbol === 'NIFTY_IT')!;

    for (const stockData of itStocks) {
        const stock = await prisma.stock.upsert({
            where: { symbol: stockData.symbol },
            update: { isFOEligible: true, lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                name: stockData.name,
                isin: stockData.isin,
                isFOEligible: true,
                lotSize: stockData.lotSize,
                industry: 'Information Technology',
                isActive: true,
            },
        });

        await prisma.sectorConstituent.upsert({
            where: { sectorId_stockId: { sectorId: niftyIT.id, stockId: stock.id } },
            update: {},
            create: { sectorId: niftyIT.id, stockId: stock.id },
        });

        await prisma.fOMaster.upsert({
            where: { symbol: stockData.symbol },
            update: { lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                lotSize: stockData.lotSize,
                tickSize: 0.05,
                isActive: true,
            },
        });
    }

    console.log(`✅ Created ${itStocks.length} NIFTY IT stocks`);

    // ================================
    // ADDITIONAL F&O STOCKS (Popular ones across sectors)
    // ================================
    console.log('📈 Seeding additional F&O stocks...');

    const additionalFOStocks = [
        // Auto
        { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', isin: 'INE585B01010', lotSize: 250, industry: 'Automobile', sector: 'NIFTY_AUTO' },
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', isin: 'INE155A01022', lotSize: 1300, industry: 'Automobile', sector: 'NIFTY_AUTO' },
        { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', isin: 'INE101A01026', lotSize: 250, industry: 'Automobile', sector: 'NIFTY_AUTO' },
        { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', isin: 'INE917I01010', lotSize: 100, industry: 'Automobile', sector: 'NIFTY_AUTO' },

        // Pharma
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', isin: 'INE044A01036', lotSize: 400, industry: 'Pharmaceuticals', sector: 'NIFTY_PHARMA' },
        { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories Ltd', isin: 'INE089A01023', lotSize: 125, industry: 'Pharmaceuticals', sector: 'NIFTY_PHARMA' },
        { symbol: 'CIPLA', name: 'Cipla Ltd', isin: 'INE059A01026', lotSize: 700, industry: 'Pharmaceuticals', sector: 'NIFTY_PHARMA' },
        { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', isin: 'INE361B01024', lotSize: 175, industry: 'Pharmaceuticals', sector: 'NIFTY_PHARMA' },

        // Metal
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', isin: 'INE081A01020', lotSize: 5200, industry: 'Metals', sector: 'NIFTY_METAL' },
        { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', isin: 'INE038A01020', lotSize: 1050, industry: 'Metals', sector: 'NIFTY_METAL' },
        { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', isin: 'INE019A01038', lotSize: 700, industry: 'Metals', sector: 'NIFTY_METAL' },
        { symbol: 'VEDL', name: 'Vedanta Ltd', isin: 'INE205A01025', lotSize: 1700, industry: 'Metals', sector: 'NIFTY_METAL' },

        // FMCG
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', isin: 'INE030A01027', lotSize: 300, industry: 'FMCG', sector: 'NIFTY_FMCG' },
        { symbol: 'ITC', name: 'ITC Ltd', isin: 'INE154A01025', lotSize: 1600, industry: 'FMCG', sector: 'NIFTY_FMCG' },
        { symbol: 'NESTLEIND', name: 'Nestle India Ltd', isin: 'INE239A01016', lotSize: 250, industry: 'FMCG', sector: 'NIFTY_FMCG' },
        { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', isin: 'INE216A01030', lotSize: 200, industry: 'FMCG', sector: 'NIFTY_FMCG' },

        // Energy
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', isin: 'INE002A01018', lotSize: 250, industry: 'Energy', sector: 'NIFTY_ENERGY' },
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', isin: 'INE213A01029', lotSize: 2800, industry: 'Energy', sector: 'NIFTY_ENERGY' },
        { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', isin: 'INE752E01010', lotSize: 2400, industry: 'Energy', sector: 'NIFTY_ENERGY' },
        { symbol: 'NTPC', name: 'NTPC Ltd', isin: 'INE733E01010', lotSize: 2300, industry: 'Energy', sector: 'NIFTY_ENERGY' },
    ];

    for (const stockData of additionalFOStocks) {
        const stock = await prisma.stock.upsert({
            where: { symbol: stockData.symbol },
            update: { isFOEligible: true, lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                name: stockData.name,
                isin: stockData.isin,
                isFOEligible: true,
                lotSize: stockData.lotSize,
                industry: stockData.industry,
                isActive: true,
            },
        });

        const sector = sectors.find((s: any) => s.symbol === stockData.sector);
        if (sector) {
            await prisma.sectorConstituent.upsert({
                where: { sectorId_stockId: { sectorId: sector.id, stockId: stock.id } },
                update: {},
                create: { sectorId: sector.id, stockId: stock.id },
            });
        }

        await prisma.fOMaster.upsert({
            where: { symbol: stockData.symbol },
            update: { lotSize: stockData.lotSize },
            create: {
                symbol: stockData.symbol,
                lotSize: stockData.lotSize,
                tickSize: 0.05,
                isActive: true,
            },
        });
    }

    console.log(`✅ Created ${additionalFOStocks.length} additional F&O stocks`);

    // ================================
    // TRADING CALENDAR - 2026 NSE Holidays
    // ================================
    console.log('📅 Seeding trading calendar...');

    const holidays2026 = [
        { date: new Date('2026-01-26'), name: 'Republic Day' },
        { date: new Date('2026-03-03'), name: 'Maha Shivaratri' },
        { date: new Date('2026-03-25'), name: 'Holi' },
        { date: new Date('2026-04-02'), name: 'Ram Navami' },
        { date: new Date('2026-04-06'), name: 'Mahavir Jayanti' },
        { date: new Date('2026-04-10'), name: 'Good Friday' },
        { date: new Date('2026-05-01'), name: 'Maharashtra Day' },
        { date: new Date('2026-08-15'), name: 'Independence Day' },
        { date: new Date('2026-08-19'), name: 'Janmashtami' },
        { date: new Date('2026-10-02'), name: 'Mahatma Gandhi Jayanti' },
        { date: new Date('2026-10-22'), name: 'Dussehra' },
        { date: new Date('2026-10-29'), name: 'Diwali Laxmi Pujan' },
        { date: new Date('2026-11-05'), name: 'Gurunanak Jayanti' },
    ];

    for (const holiday of holidays2026) {
        await prisma.tradingCalendar.upsert({
            where: { date: holiday.date },
            update: {},
            create: {
                date: holiday.date,
                isHoliday: true,
                holidayName: holiday.name,
                sessionType: 'CLOSED',
            },
        });
    }

    console.log(`✅ Created ${holidays2026.length} trading holidays`);

    console.log('✨ Seed complete!');
    console.log('\n📊 Summary:');
    console.log(`   - ${sectors.length} sectors`);
    console.log(`   - ${bankStocks.length + itStocks.length + additionalFOStocks.length} F&O stocks`);
    console.log(`   - ${holidays2026.length} trading holidays`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
