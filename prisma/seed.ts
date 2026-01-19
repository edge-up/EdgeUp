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

            // HANDLE FUTURES
            // CSV: NSE, D, ID, FUTSTK, ..., RELIANCE-Jan2026-FUT, ...
            const isFutures = instrument === 'FUTSTK' && (exchange === 'NFO' || exchange === 'NSE');

            if (isFutures) {
                // Extract underlying symbol from "RELIANCE-Jan2026-FUT" -> "RELIANCE"
                // Some might be "M&M-Jan2026-FUT", so be careful with splitting.
                // Usually it's Symbol-ExpiryString-FUT.
                // Safest is to take everything before the last two hyphens? 
                // Or just use the first part if we assume standard format.
                // Let's try splitting by '-' and taking the first part for now.
                // But "M&M" might be safe? "M&M-Jan..." -> "M&M"

                let underlying = cleanSymbol;
                const hyphenIndex = cleanSymbol.indexOf('-');
                if (hyphenIndex > 0) {
                    underlying = cleanSymbol.substring(0, hyphenIndex);
                }

                const expiry = parts[8]?.trim();

                if (!futCandidates[underlying]) futCandidates[underlying] = [];
                futCandidates[underlying].push({ id: securityId, expiry });
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
    // Seed all 18 major NIFTY sectoral indices
    const sectors = await prisma.$transaction([
        // Existing sectors (8)
        prisma.sector.upsert({ where: { symbol: 'NIFTY_BANK' }, create: { name: 'NIFTY BANK', symbol: 'NIFTY_BANK', description: 'Banking', isActive: true, dhanSecurityId: 'IDX_I_13' }, update: { dhanSecurityId: 'IDX_I_13' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_IT' }, create: { name: 'NIFTY IT', symbol: 'NIFTY_IT', description: 'IT', isActive: true, dhanSecurityId: 'IDX_I_29' }, update: { dhanSecurityId: 'IDX_I_29' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_PHARMA' }, create: { name: 'NIFTY PHARMA', symbol: 'NIFTY_PHARMA', description: 'Pharma', isActive: true, dhanSecurityId: 'IDX_I_34' }, update: { dhanSecurityId: 'IDX_I_34' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_AUTO' }, create: { name: 'NIFTY AUTO', symbol: 'NIFTY_AUTO', description: 'Auto', isActive: true, dhanSecurityId: 'IDX_I_12' }, update: { dhanSecurityId: 'IDX_I_12' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_METAL' }, create: { name: 'NIFTY METAL', symbol: 'NIFTY_METAL', description: 'Metal', isActive: true, dhanSecurityId: 'IDX_I_31' }, update: { dhanSecurityId: 'IDX_I_31' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_FMCG' }, create: { name: 'NIFTY FMCG', symbol: 'NIFTY_FMCG', description: 'FMCG', isActive: true, dhanSecurityId: 'IDX_I_27' }, update: { dhanSecurityId: 'IDX_I_27' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_FIN_SERVICE' }, create: { name: 'NIFTY FINANCIAL SERVICES', symbol: 'NIFTY_FIN_SERVICE', description: 'Fin Service', isActive: true, dhanSecurityId: 'IDX_I_26' }, update: { dhanSecurityId: 'IDX_I_26' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_ENERGY' }, create: { name: 'NIFTY ENERGY', symbol: 'NIFTY_ENERGY', description: 'Energy', isActive: true, dhanSecurityId: 'IDX_I_25' }, update: { dhanSecurityId: 'IDX_I_25' } }),

        // New sectors (10)
        prisma.sector.upsert({ where: { symbol: 'NIFTY_REALTY' }, create: { name: 'NIFTY REALTY', symbol: 'NIFTY_REALTY', description: 'Realty', isActive: true, dhanSecurityId: 'IDX_I_35' }, update: { dhanSecurityId: 'IDX_I_35' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_MEDIA' }, create: { name: 'NIFTY MEDIA', symbol: 'NIFTY_MEDIA', description: 'Media', isActive: true, dhanSecurityId: 'IDX_I_30' }, update: { dhanSecurityId: 'IDX_I_30' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_PSU_BANK' }, create: { name: 'NIFTY PSU BANK', symbol: 'NIFTY_PSU_BANK', description: 'PSU Bank', isActive: true, dhanSecurityId: 'IDX_I_37' }, update: { dhanSecurityId: 'IDX_I_37' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_PRIVATE_BANK' }, create: { name: 'NIFTY PRIVATE BANK', symbol: 'NIFTY_PRIVATE_BANK', description: 'Private Bank', isActive: true, dhanSecurityId: 'IDX_I_36' }, update: { dhanSecurityId: 'IDX_I_36' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_HEALTHCARE' }, create: { name: 'NIFTY HEALTHCARE', symbol: 'NIFTY_HEALTHCARE', description: 'Healthcare', isActive: true, dhanSecurityId: 'IDX_I_28' }, update: { dhanSecurityId: 'IDX_I_28' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_OIL_GAS' }, create: { name: 'NIFTY OIL & GAS', symbol: 'NIFTY_OIL_GAS', description: 'Oil & Gas', isActive: true, dhanSecurityId: 'IDX_I_32' }, update: { dhanSecurityId: 'IDX_I_32' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_CONSUMER_DURABLES' }, create: { name: 'NIFTY CONSUMER DURABLES', symbol: 'NIFTY_CONSUMER_DURABLES', description: 'Consumer Durables', isActive: true, dhanSecurityId: 'IDX_I_24' }, update: { dhanSecurityId: 'IDX_I_24' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_COMMODITIES' }, create: { name: 'NIFTY COMMODITIES', symbol: 'NIFTY_COMMODITIES', description: 'Commodities', isActive: true, dhanSecurityId: 'IDX_I_55' }, update: { dhanSecurityId: 'IDX_I_55' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_INFRASTRUCTURE' }, create: { name: 'NIFTY INFRASTRUCTURE', symbol: 'NIFTY_INFRASTRUCTURE', description: 'Infrastructure', isActive: true, dhanSecurityId: 'IDX_I_56' }, update: { dhanSecurityId: 'IDX_I_56' } }),
        prisma.sector.upsert({ where: { symbol: 'NIFTY_MNC' }, create: { name: 'NIFTY MNC', symbol: 'NIFTY_MNC', description: 'MNC', isActive: true, dhanSecurityId: 'IDX_I_62' }, update: { dhanSecurityId: 'IDX_I_62' } }),
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

    // NEW SECTORS - Comprehensive F&O Stock Lists

    await seedStocks([
        { symbol: 'DLF', name: 'DLF Ltd', isin: 'INE271C01023', lotSize: 1800, industry: 'Realty' },
        { symbol: 'OBEROIRLTY', name: 'Oberoi Realty Ltd', isin: 'INE093I01010', lotSize: 250, industry: 'Realty' },
        { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', isin: 'INE484J01027', lotSize: 400, industry: 'Realty' },
        { symbol: 'PRESTIGE', name: 'Prestige Estates Projects Ltd', isin: 'INE811K01011', lotSize: 600, industry: 'Realty' },
        { symbol: 'BRIGADE', name: 'Brigade Enterprises Ltd', isin: 'INE791I01019', lotSize: 1350, industry: 'Realty' },
        { symbol: 'PHOENIXLTD', name: 'The Phoenix Mills Ltd', isin: 'INE211B01039', lotSize: 400, industry: 'Realty' },
        { symbol: 'LODHA', name: 'Macrotech Developers Ltd', isin: 'INE670K01029', lotSize: 500, industry: 'Realty' }
    ], 'NIFTY_REALTY');

    await seedStocks([
        { symbol: 'ZEEL', name: 'Zee Entertainment Enterprises Ltd', isin: 'INE256A01028', lotSize: 3700, industry: 'Media' },
        { symbol: 'PVRINOX', name: 'PVR INOX Ltd', isin: 'INE191H01014', lotSize: 350, industry: 'Media' },
        { symbol: 'SUNTV', name: 'Sun TV Network Ltd', isin: 'INE424H01027', lotSize: 1150, industry: 'Media' },
        { symbol: 'NAZARA', name: 'Nazara Technologies Ltd', isin: 'INE418M01016', lotSize: 1200, industry: 'Media' }
    ], 'NIFTY_MEDIA');

    await seedStocks([
        { symbol: 'SBIN', name: 'State Bank of India', isin: 'INE062A01020', lotSize: 1500, industry: 'PSU Bank' },
        { symbol: 'CANBK', name: 'Canara Bank', isin: 'INE476A01022', lotSize: 8500, industry: 'PSU Bank' },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', isin: 'INE028A01039', lotSize: 5200, industry: 'PSU Bank' },
        { symbol: 'PNB', name: 'Punjab National Bank', isin: 'INE160A01022', lotSize: 15000, industry: 'PSU Bank' },
        { symbol: 'UNIONBANK', name: 'Union Bank of India', isin: 'INE692A01016', lotSize: 6600, industry: 'PSU Bank' },
        { symbol: 'INDIANB', name: 'Indian Bank', isin: 'INE562A01011', lotSize: 1800, industry: 'PSU Bank' },
        { symbol: 'MAHABANK', name: 'Bank of Maharashtra', isin: 'INE457A01014', lotSize: 23000, industry: 'PSU Bank' }
    ], 'NIFTY_PSU_BANK');

    await seedStocks([
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', isin: 'INE040A01034', lotSize: 550, industry: 'Private Bank' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', isin: 'INE090A01021', lotSize: 1100, industry: 'Private Bank' },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', isin: 'INE237A01028', lotSize: 400, industry: 'Private Bank' },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', isin: 'INE238A01034', lotSize: 1200, industry: 'Private Bank' },
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', isin: 'INE095A01012', lotSize: 900, industry: 'Private Bank' },
        { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', isin: 'INE171A01029', lotSize: 4000, industry: 'Private Bank' },
        { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd', isin: 'INE545U01014', lotSize: 3900, industry: 'Private Bank' },
        { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', isin: 'INE092T01019', lotSize: 10000, industry: 'Private Bank' }
    ], 'NIFTY_PRIVATE_BANK');

    await seedStocks([
        { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', isin: 'INE437A01024', lotSize: 125, industry: 'Healthcare' },
        { symbol: 'MAX', name: 'Max Healthcare Institute Ltd', isin: 'INE027H01010', lotSize: 1200, industry: 'Healthcare' },
        { symbol: 'FORTIS', name: 'Fortis Healthcare Ltd', isin: 'INE061F01013', lotSize: 1800, industry: 'Healthcare' },
        { symbol: 'LALPATHLAB', name: 'Dr. Lal Path Labs Ltd', isin: 'INE600L01024', lotSize: 300, industry: 'Healthcare' },
        { symbol: 'METROPOLIS', name: 'Metropolis Healthcare Ltd', isin: 'INE112L01020', lotSize: 350, industry: 'Healthcare' }
    ], 'NIFTY_HEALTHCARE');

    await seedStocks([
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', isin: 'INE002A01018', lotSize: 250, industry: 'Oil & Gas' },
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', isin: 'INE213A01029', lotSize: 2800, industry: 'Oil & Gas' },
        { symbol: 'IOC', name: 'Indian Oil Corporation Ltd', isin: 'INE242A01010', lotSize: 5600, industry: 'Oil & Gas' },
        { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', isin: 'INE029A01011', lotSize: 1800, industry: 'Oil & Gas' },
        { symbol: 'GAIL', name: 'GAIL (India) Ltd', isin: 'INE129A01019', lotSize: 4100, industry: 'Oil & Gas' },
        { symbol: 'HINDPETRO', name: 'Hindustan Petroleum Corporation Ltd', isin: 'INE094A01015', lotSize: 2100, industry: 'Oil & Gas' },
        { symbol: 'MGL', name: 'Mahanagar Gas Ltd', isin: 'INE002S01010', lotSize: 550, industry: 'Oil & Gas' }
    ], 'NIFTY_OIL_GAS');

    await seedStocks([
        { symbol: 'VOLTAS', name: 'Voltas Ltd', isin: 'INE226A01021', lotSize: 700, industry: 'Consumer Durables' },
        { symbol: 'HAVELLS', name: 'Havells India Ltd', isin: 'INE176B01034', lotSize: 500, industry: 'Consumer Durables' },
        { symbol: 'WHIRLPOOL', name: 'Whirlpool of India Ltd', isin: 'INE716A01013', lotSize: 450, industry: 'Consumer Durables' },
        { symbol: 'CROMPTON', name: 'Crompton Greaves Consumer Electricals Ltd', isin: 'INE299U01018', lotSize: 1900, industry: 'Consumer Durables' },
        { symbol: 'DIXON', name: 'Dixon Technologies (India) Ltd', isin: 'INE935S01011', lotSize: 100, industry: 'Consumer Durables' },
        { symbol: 'AMBER', name: 'Amber Enterprises India Ltd', isin: 'INE371P01015', lotSize: 200, industry: 'Consumer Durables' },
        { symbol: 'BLUESTARCO', name: 'Blue Star Ltd', isin: 'INE472A01039', lotSize: 600, industry: 'Consumer Durables' }
    ], 'NIFTY_CONSUMER_DURABLES');

    await seedStocks([
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', isin: 'INE081A01020', lotSize: 6100, industry: 'Commodities' },
        { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', isin: 'INE038A01020', lotSize: 1400, industry: 'Commodities' },
        { symbol: 'VEDL', name: 'Vedanta Ltd', isin: 'INE205A01025', lotSize: 2400, industry: 'Commodities' },
        { symbol: 'COALINDIA', name: 'Coal India Ltd', isin: 'INE522F01014', lotSize: 1850, industry: 'Commodities' },
        { symbol: 'SAIL', name: 'Steel Authority of India Ltd', isin: 'INE114A01011', lotSize: 7700, industry: 'Commodities' },
        { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', isin: 'INE019A01038', lotSize: 1000, industry: 'Commodities' },
        { symbol: 'NMDC', name: 'NMDC Ltd', isin: 'INE584A01023', lotSize: 3600, industry: 'Commodities' }
    ], 'NIFTY_COMMODITIES');

    await seedStocks([
        { symbol: 'LT', name: 'Larsen & Toubro Ltd', isin: 'INE018A01030', lotSize: 250, industry: 'Infrastructure' },
        { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd', isin: 'INE742F01042', lotSize: 700, industry: 'Infrastructure' },
        { symbol: 'GRASIM', name: 'Grasim Industries Ltd', isin: 'INE047A01021', lotSize: 400, industry: 'Infrastructure' },
        { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', isin: 'INE481G01011', lotSize: 75, industry: 'Infrastructure' },
        { symbol: 'ACC', name: 'ACC Ltd', isin: 'INE012A01025', lotSize: 300, industry: 'Infrastructure' },
        { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd', isin: 'INE079A01024', lotSize: 1500, industry: 'Infrastructure' },
        { symbol: 'PFC', name: 'Power Finance Corporation Ltd', isin: 'INE134E01011', lotSize: 1950, industry: 'Infrastructure' },
        { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', isin: 'INE752E01010', lotSize: 2400, industry: 'Infrastructure' }
    ], 'NIFTY_INFRASTRUCTURE');

    await seedStocks([
        { symbol: 'NESTLEIND', name: 'Nestle India Ltd', isin: 'INE239A01016', lotSize: 200, industry: 'MNC' },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', isin: 'INE030A01027', lotSize: 300, industry: 'MNC' },
        { symbol: 'ABB', name: 'ABB India Ltd', isin: 'INE117A01022', lotSize: 175, industry: 'MNC' },
        { symbol: 'SIEMENS', name: 'Siemens Ltd', isin: 'INE003A01024', lotSize: 200, industry: 'MNC' },
        { symbol: 'BOSCHLTD', name: 'Bosch Ltd', isin: 'INE323A01026', lotSize: 25, industry: 'MNC' },
        { symbol: 'HONAUT', name: 'Honeywell Automation India Ltd', isin: 'INE671A01010', lotSize: 25, industry: 'MNC' },
        { symbol: '3MINDIA', name: '3M India Ltd', isin: 'INE470A01017', lotSize: 25, industry: 'MNC' }
    ], 'NIFTY_MNC');

    console.log('📅 Seeding Trading Calendar (2025-2026)...');

    // NSE Holiday Calendar 2025-2026
    const tradingHolidays = [
        // 2025 Holidays
        { date: '2025-01-26', name: 'Republic Day', session: 'CLOSED' },
        { date: '2025-03-14', name: 'Holi', session: 'CLOSED' },
        { date: '2025-03-31', name: 'Id-Ul-Fitr (Ramadan Eid)', session: 'CLOSED' },
        { date: '2025-04-10', name: 'Mahavir Jayanti', session: 'CLOSED' },
        { date: '2025-04-14', name: 'Dr. Baba Saheb Ambedkar Jayanti', session: 'CLOSED' },
        { date: '2025-04-18', name: 'Good Friday', session: 'CLOSED' },
        { date: '2025-05-01', name: 'Maharashtra Day', session: 'CLOSED' },
        { date: '2025-06-07', name: 'Bakri Id', session: 'CLOSED' },
        { date: '2025-08-15', name: 'Independence Day', session: 'CLOSED' },
        { date: '2025-08-27', name: 'Ganesh Chaturthi', session: 'CLOSED' },
        { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti', session: 'CLOSED' },
        { date: '2025-10-21', name: 'Dussehra', session: 'CLOSED' },
        { date: '2025-11-01', name: 'Diwali Laxmi Pujan', session: 'CLOSED' },
        { date: '2025-11-05', name: 'Gurunanak Jayanti', session: 'CLOSED' },
        { date: '2025-12-25', name: 'Christmas', session: 'CLOSED' },

        // 2026 Holidays (partial list - update as NSE announces)
        { date: '2026-01-26', name: 'Republic Day', session: 'CLOSED' },
        { date: '2026-03-03', name: 'Holi', session: 'CLOSED' },
        { date: '2026-03-20', name: 'Id-Ul-Fitr (Ramadan Eid) (Tentative)', session: 'CLOSED' },
        { date: '2026-04-02', name: 'Mahavir Jayanti', session: 'CLOSED' },
        { date: '2026-04-03', name: 'Good Friday', session: 'CLOSED' },
        { date: '2026-04-06', name: 'Ram Navami', session: 'CLOSED' },
        { date: '2026-04-14', name: 'Dr. Baba Saheb Ambedkar Jayanti', session: 'CLOSED' },
        { date: '2026-05-01', name: 'Maharashtra Day', session: 'CLOSED' },
        { date: '2026-05-27', name: 'Bakri Id (Tentative)', session: 'CLOSED' },
        { date: '2026-08-15', name: 'Independence Day', session: 'CLOSED' },
        { date: '2026-08-16', name: 'Parsi New Year', session: 'CLOSED' },
        { date: '2026-09-15', name: 'Ganesh Chaturthi', session: 'CLOSED' },
        { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', session: 'CLOSED' },
        { date: '2026-10-09', name: 'Dussehra', session: 'CLOSED' },
        { date: '2026-10-20', name: 'Diwali Laxmi Pujan', session: 'CLOSED' },
        { date: '2026-11-25', name: 'Gurunanak Jayanti', session: 'CLOSED' },
        { date: '2026-12-25', name: 'Christmas', session: 'CLOSED' },
    ];

    for (const holiday of tradingHolidays) {
        await prisma.tradingCalendar.upsert({
            where: { date: new Date(holiday.date) },
            create: {
                date: new Date(holiday.date),
                isHoliday: true,
                holidayName: holiday.name,
                sessionType: holiday.session as any,
            },
            update: {
                isHoliday: true,
                holidayName: holiday.name,
                sessionType: holiday.session as any,
            },
        });
    }

    console.log(`✅ Seeded ${tradingHolidays.length} trading holidays`);
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
