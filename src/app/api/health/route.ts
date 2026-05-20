import { NextResponse } from 'next/server';
import { dbHealthCheck } from '@/lib/db';
import { redisHealthCheck } from '@/lib/redis';
import { queueHealthCheck } from '@/lib/queue';

export async function GET() {
  const [dbStatus, redisStatus, queueStatus] = await Promise.all([
    dbHealthCheck(),
    redisHealthCheck(),
    queueHealthCheck(),
  ]);

  const isHealthy =
    dbStatus.status !== 'unhealthy' &&
    redisStatus.status !== 'unhealthy' &&
    queueStatus.status !== 'unhealthy';

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'storecraft-app',
    version: '2.0.0',
    database: {
      provider: 'postgresql',
      ...dbStatus,
    },
    redis: redisStatus,
    queues: queueStatus,
    uptime: process.uptime(),
  });
}
