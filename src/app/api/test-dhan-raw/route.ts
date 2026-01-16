import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Raw Dhan API test - shows actual response
 */
export async function GET() {
    try {
        const clientId = process.env.DHAN_CLIENT_ID;
        const accessToken = process.env.DHAN_ACCESS_TOKEN;

        const requestBody = {
            securityId: "1594", // INFY internal ID
            exchangeSegment: "NSE_EQ",
            instrument: "EQUITY",
            fromDate: "2026-01-10",
            toDate: "2026-01-16"
        };

        console.log('Request:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.dhan.co/v2/charts/intraday', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access-token': accessToken || '',
            },
            body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response (first 1000 chars):', responseText.substring(0, 1000));

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch {
            parsedData = { raw: responseText };
        }

        return NextResponse.json({
            request: requestBody,
            responseStatus: response.status,
            responseText: responseText.substring(0, 500),
            parsed: parsedData,
            dataType: typeof parsedData,
            isArray: Array.isArray(parsedData),
            keys: parsedData && typeof parsedData === 'object' ? Object.keys(parsedData) : []
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
