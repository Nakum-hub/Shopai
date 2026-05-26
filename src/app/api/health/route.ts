import { NextRequest } from 'next/server';
import { dbHealthCheck } from '@/lib/db';
import { redisHealthCheck } from '@/lib/redis';
import { queueHealthCheck } from '@/lib/queue';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ServiceUnavailableError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      logger.info('[HEALTH_GET] Running health checks');

      const [dbStatus, redisStatus, queueStatus] = await Promise.all([
        dbHealthCheck(),
        redisHealthCheck(),
        queueHealthCheck(),
      ]);

      const isHealthy =
        dbStatus.status !== 'unhealthy' &&
        redisStatus.status !== 'unhealthy' &&
        queueStatus.status !== 'unhealthy';

      if (!isHealthy) {
        logger.warn('[HEALTH_GET] Unhealthy components detected', {
          db: dbStatus.status,
          redis: redisStatus.status,
          queue: queueStatus.status,
        });
      }

      return success({
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
      }, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
