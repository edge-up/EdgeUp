import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * NSE Trading Holidays for 2026
 * Source: NSE India Official Holiday Calendar
 */
const NSE_HOLIDAYS_2026 = [
    { date: '2026-01-26', name: 'Republic Day', type: 'NORMAL' },
    { date: '2026-03-03', name: 'Maha Shivratri', type: 'NORMAL' },
    { date: '2026-03-25', name: 'Holi', type: 'NORMAL' },
    { date: '2026-03-30', name: 'Good Friday', type: 'NORMAL' },
    { date: '2026-04-02', name: 'Ram Navami', type: 'NORMAL' },
    { date: '2026-04-06', name: 'Mahavir Jayanti', type: 'NORMAL' },
    { date: '2026-04-14', name: 'Dr. Baba Saheb Ambedkar Jayanti', type: 'NORMAL' },
    { date: '2026-05-01', name: 'Maharashtra Day', type: 'NORMAL' },
    { date: '2026-08-15', name: 'Independence Day', type: 'NORMAL' },
    { date: '2026-08-31', name: 'Ganesh Chaturthi', type: 'NORMAL' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'NORMAL' },
    { date: '2026-10-19', name: 'Dussehra', type: 'NORMAL' },
    { date: '2026-11-04', name: 'Diwali (Laxmi Pujan)', type: 'NORMAL' },
    { date: '2026-11-05', name: 'Diwali (Balipratipada)', type: 'NORMAL' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'NORMAL' },
    { date: '2026-12-25', name: 'Christmas', type: 'NORMAL' },
];

async function seedHolidays() {
    console.log('🌟 Seeding NSE holidays for 2026...\n');

    let addedCount = 0;
    let skippedCount = 0;

    for (const holiday of NSE_HOLIDAYS_2026) {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);

        try {
            const existing = await prisma.tradingCalendar.findUnique({
                where: { date: holidayDate },
            });

            if (existing) {
                console.log(`⏭️  Skipped: ${holiday.name} (${holiday.date}) - already exists`);
                skippedCount++;
            } else {
                await prisma.tradingCalendar.create({
                    data: {
                        date: holidayDate,
                        isHoliday: true,
                        holidayName: holiday.name,
                        sessionType: holiday.type as any,
                    },
                });
                console.log(`✅ Added: ${holiday.name} (${holiday.date})`);
                addedCount++;
            }
        } catch (error) {
            console.error(`❌ Failed to add ${holiday.name}:`, error);
        }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   Added: ${addedCount} holidays`);
    console.log(`   Skipped: ${skippedCount} holidays (already existed)`);
    console.log(`   Total: ${NSE_HOLIDAYS_2026.length} holidays for 2026`);
}

async function main() {
    try {
        await seedHolidays();
    } catch (error) {
        console.error('Error seeding holidays:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
