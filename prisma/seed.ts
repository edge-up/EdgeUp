import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScripMap {
    [symbol: string]: { eqId?: string; fnoId?: string };
}

async function fetchDhanScripMaster(): Promise<ScripMap> {
    console.log('⬇️ Fetching Dhan Scrip Master CSV...');
    try {
        const response = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
        if (!response.ok) {
            throw new Error(`Failed to fetch scrip master: ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log(`✅ CSV Downloaded (${(csvText.length / 1024 / 1024).toFixed(2)} MB)`);

        const lines = csvText.split('\n');
        const scripMap: ScripMap = {};

        // Find nearest expiry (Current Month)
        const futCandidates: Record<string, { id: string, expiry: string }[]> = {};

        let eqCount = 0;
        let futCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            // CSV Format:
            // 0: SEM_EXM_EXCH_ID (NSE, BSE, NFO)
            // 1: SEM_SEGMENT (E=Equity, C=Currency, etc)
            // 2: SEM_SMST_SECURITY_ID (Security ID like 2885)
            // 3: SEM_INSTRUMENT_NAME (EQUITY, FUTSTK, etc)
            // 5: SEM_TRADING_SYMBOL (RELIANCE, TCS, etc)

            const exchange = parts[0]?.trim();
            const segment = parts[1]?.trim();
            const securityId = parts[2]?.trim();
            const instrument = parts[3]?.trim();
            const symbol = parts[5]?.trim();  // Changed from parts[15] to parts[5]

            const cleanSymbol = symbol ? symbol.replace(/"/g, '') : '';

            if (!cleanSymbol) continue;

            // HANDLE EQUITY (NSE, Segment E, Instrument EQUITY)
            if (exchange === 'NSE' && segment === 'E' && instrument === 'EQUITY') {
                if (!scripMap[cleanSymbol]) scripMap[cleanSymbol] = {};
                scripMap[cleanSymbol].eqId = `NSE_EQ_${securityId}`;
                eqCount++;
            }

            // HANDLE FUTURES (NFO exchange, FUTSTK instrument)
            if (exchange === 'NFO' && instrument === 'FUTSTK') {
                const expiry = parts[8]?.trim();
                if (!futCandidates[cleanSymbol]) futCandidates[cleanSymbol] = [];
                futCandidates[cleanSymbol].push({ id: securityId, expiry });
            }
        }

        // Process Futures
        const now = new Date();

        Object.entries(futCandidates).forEach(([sym, candidates]) => {
            candidates.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
            const valid = candidates.find(c => new Date(c.expiry) > now);
            const selected = valid || candidates[candidates.length - 1];

            if (selected) {
                if (!scripMap[sym]) scripMap[sym] = {};
                scripMap[sym].fnoId = `NSE_FNO_${selected.id}`;
                futCount++;
            }
        });

        console.log(`✅ Parsed ${eqCount} EQ and ${futCount} FUT instruments`);
        return scripMap;
    } catch (error) {
        console.error('❌ Error fetching scrip master:', error);
        return {};
    }
}

async function main() {
    console.log('🌱 Starting seed...');

    const scripMap = await fetchDhanScripMaster();

    console.log('📊 Seeding sectors...');
    // ... (abbreviated sector seeding for brevity, but needed for file correctness)
    const sectors = await prisma.$transaction([
        prisma.sector.upsert({ where: { symbol: 'NIFTY_BANK' }, create: { name: 'NIFTY BANK', symbol: 'NIFTY_BANK', description: 'Banking', isActive: true, dhanSecurityId: 'IDX_NIFTY_BANK' }, update: { dhanSecurityId: 'IDX_NIFTY_BANK' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_IT' }, create: { name: 'NIFTY IT', symbol: 'NIFTY_IT', description: 'IT', isActive: true, dhanSecurityId: 'IDX_NIFTY_IT' }, update: { dhanSecurityId: 'IDX_NIFTY_IT' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_PHARMA' }, create: { name: 'NIFTY PHARMA', symbol: 'NIFTY_PHARMA', description: 'Pharma', isActive: true, dhanSecurityId: 'IDX_NIFTY_PHARMA' }, update: { dhanSecurityId: 'IDX_NIFTY_PHARMA' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_AUTO' }, create: { name: 'NIFTY AUTO', symbol: 'NIFTY_AUTO', description: 'Auto', isActive: true, dhanSecurityId: 'IDX_NIFTY_AUTO' }, update: { dhanSecurityId: 'IDX_NIFTY_AUTO' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_METAL' }, create: { name: 'NIFTY METAL', symbol: 'NIFTY_METAL', description: 'Metal', isActive: true, dhanSecurityId: 'IDX_NIFTY_METAL' }, update: { dhanSecurityId: 'IDX_NIFTY_METAL' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_FMCG' }, create: { name: 'NIFTY FMCG', symbol: 'NIFTY_FMCG', description: 'FMCG', isActive: true, dhanSecurityId: 'IDX_NIFTY_FMCG' }, update: { dhanSecurityId: 'IDX_NIFTY_FMCG' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_FIN_SERVICE' }, create: { name: 'NIFTY FINANCIAL SERVICES', symbol: 'NIFTY_FIN_SERVICE', description: 'Fin Service', isActive: true, dhanSecurityId: 'IDX_NIFTY_FIN_SERVICE' }, update: { dhanSecurityId: 'IDX_NIFTY_FIN_SERVICE' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_ENERGY' }, create: { name: 'NIFTY ENERGY', symbol: 'NIFTY_ENERGY', description: 'Energy', isActive: true, dhanSecurityId: 'IDX_NIFTY_ENERGY' }, update: { dhanSecurityId: 'IDX_NIFTY_ENERGY' } }),
    ]);

    const seedStocks = async (stockList: any[], sectorSymbol: string) => {
        const sector = sectors.find((s: any) => s.symbol === sectorSymbol);
        if (!sector) return;

        for (const s of stockList) {
            const mapEntry = scripMap[s.symbol];
            // Debug failure per stock
            if (!mapEntry || !mapEntry.eqId) {
                console.warn(`⚠️ No Dhan EQ ID found for ${s.symbol} (Map has: ${JSON.stringify(mapEntry)})`);
                continue;
            }

            const stock = await prisma.stock.upsert({
                where: { symbol: s.symbol },
                create: {
                    symbol: s.symbol,
                    name: s.name,
                    isin: s.isin,
                    isFOEligible: true,
                    lotSize: s.lotSize,
                    dhanSecurityId: mapEntry.eqId,
                    dhanFNOSecurityId: mapEntry.fnoId || null,
                    industry: s.industry,
                    isActive: true,
                },
                update: {
                    dhanSecurityId: mapEntry.eqId,
                    dhanFNOSecurityId: mapEntry.fnoId || null,
                    isFOEligible: true,
                    lotSize: s.lotSize,
                }
            });
            await prisma.sectorConstituent.upsert({
                where: { sectorId_stockId: { sectorId: sector.id, stockId: stock.id } },
                create: { sectorId: sector.id, stockId: stock.id },
                update: {},
            });
            await prisma.fOMaster.upsert({
                where: { symbol: s.symbol },
                create: { symbol: s.symbol, lotSize: s.lotSize, isActive: true },
                update: { lotSize: s.lotSize },
            });
        }
    };

    console.log('🏦 Seeding Stocks...');

    await seedStocks([
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', isin: 'INE040A01034', lotSize: 550, industry: 'Banking' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', isin: 'INE090A01021', lotSize: 1100, industry: 'Banking' },
        { symbol: 'SBIN', name: 'State Bank of India', isin: 'INE062A01020', lotSize: 1500, industry: 'Banking' },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', isin: 'INE237A01028', lotSize: 400, industry: 'Banking' },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', isin: 'INE238A01034', lotSize: 1200, industry: 'Banking' },
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', isin: 'INE095A01012', lotSize: 900, industry: 'Banking' },
        { symbol: 'AUBANK', name: 'AU Small Finance Bank Ltd', isin: 'INE949L01017', lotSize: 1800, industry: 'Banking' },
        { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', isin: 'INE092T01019', lotSize: 10000, industry: 'Banking' },
        { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', isin: 'INE171A01029', lotSize: 4000, industry: 'Banking' },
        { symbol: 'CANBK', name: 'Canara Bank', isin: 'INE476A01022', lotSize: 8500, industry: 'Banking' },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', isin: 'INE028A01039', lotSize: 5200, industry: 'Banking' },
        { symbol: 'PNB', name: 'Punjab National Bank', isin: 'INE160A01022', lotSize: 15000, industry: 'Banking' },
        { symbol: 'UNIONBANK', name: 'Union Bank of India', isin: 'INE692A01016', lotSize: 6600, industry: 'Banking' },
        { symbol: 'YESBANK', name: 'Yes Bank Ltd', isin: 'INE528G01035', lotSize: 38000, industry: 'Banking' }
    ], 'NIFTY_BANK');

    await seedStocks([
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', isin: 'INE467B01029', lotSize: 125, industry: 'IT' },
        { symbol: 'INFY', name: 'Infosys Ltd', isin: 'INE009A01021', lotSize: 300, industry: 'IT' },
        { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', isin: 'INE860A01027', lotSize: 350, industry: 'IT' },
        { symbol: 'WIPRO', name: 'Wipro Ltd', isin: 'INE075A01022', lotSize: 1200, industry: 'IT' },
        { symbol: 'LTIM', name: 'LTIMindtree Ltd', isin: 'INE214T01019', lotSize: 150, industry: 'IT' },
        { symbol: 'TECHM', name: 'Tech Mahindra Ltd', isin: 'INE669C01036', lotSize: 550, industry: 'IT' },
        { symbol: 'MPHASIS', name: 'Mphasis Ltd', isin: 'INE356A01018', lotSize: 250, industry: 'IT' },
        { symbol: 'COFORGE', name: 'Coforge Ltd', isin: 'INE591G01017', lotSize: 100, industry: 'IT' },
        { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', isin: 'INE262H01013', lotSize: 125, industry: 'IT' },
        { symbol: 'OFSS', name: 'Oracle Financial Services Software Ltd', isin: 'INE881D01027', lotSize: 125, industry: 'IT' }
    ], 'NIFTY_IT');

    await seedStocks([
        { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', isin: 'INE585B01010', lotSize: 250, industry: 'Auto' },
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', isin: 'INE155A01022', lotSize: 1300, industry: 'Auto' },
        { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', isin: 'INE101A01026', lotSize: 250, industry: 'Auto' },
        { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', isin: 'INE917I01010', lotSize: 100, industry: 'Auto' }
    ], 'NIFTY_AUTO');

    await seedStocks([
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', isin: 'INE044A01036', lotSize: 400, industry: 'Pharma' },
        { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories Ltd', isin: 'INE089A01023', lotSize: 125, industry: 'Pharma' },
        { symbol: 'CIPLA', name: 'Cipla Ltd', isin: 'INE059A01026', lotSize: 700, industry: 'Pharma' },
        { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', isin: 'INE361B01024', lotSize: 175, industry: 'Pharma' }
    ], 'NIFTY_PHARMA');

    await seedStocks([
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', isin: 'INE081A01020', lotSize: 5200, industry: 'Metal' },
        { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', isin: 'INE038A01020', lotSize: 1050, industry: 'Metal' },
        { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', isin: 'INE019A01038', lotSize: 700, industry: 'Metal' },
        { symbol: 'VEDL', name: 'Vedanta Ltd', isin: 'INE205A01025', lotSize: 1700, industry: 'Metal' }
    ], 'NIFTY_METAL');

    await seedStocks([
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', isin: 'INE030A01027', lotSize: 300, industry: 'FMCG' },
        { symbol: 'ITC', name: 'ITC Ltd', isin: 'INE154A01025', lotSize: 1600, industry: 'FMCG' },
        { symbol: 'NESTLEIND', name: 'Nestle India Ltd', isin: 'INE239A01016', lotSize: 250, industry: 'FMCG' },
        { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', isin: 'INE216A01030', lotSize: 200, industry: 'FMCG' }
    ], 'NIFTY_FMCG');

    await seedStocks([
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', isin: 'INE002A01018', lotSize: 250, industry: 'Energy' },
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', isin: 'INE213A01029', lotSize: 2800, industry: 'Energy' },
        { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', isin: 'INE752E01010', lotSize: 2400, industry: 'Energy' },
        { symbol: 'NTPC', name: 'NTPC Ltd', isin: 'INE733E01010', lotSize: 2300, industry: 'Energy' }
    ], 'NIFTY_ENERGY');

    console.log('✨ Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
