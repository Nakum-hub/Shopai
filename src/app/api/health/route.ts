import { NextResponse } from 'next/server';
import { dbHealthCheck } from '@/lib/db';

export async function GET() {
  const dbStatus = await dbHealthCheck();

  return NextResponse.json({
    status: dbStatus.status === 'unhealthy' ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    service: 'storecraft-app',
    version: '2.0.0',
    database: {
      provider: 'sqlite',
      ...dbStatus,
    },
    uptime: process.uptime(),
  });
}
