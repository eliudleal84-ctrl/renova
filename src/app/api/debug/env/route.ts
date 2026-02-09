import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasUri: !!process.env.MONGODB_URI,
        uriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 10) : 'none',
        nodeEnv: process.env.NODE_ENV,
    });
}
