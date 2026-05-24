import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, error, paginated, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const { searchParams } = new URL(request.url);
      const executionId = searchParams.get('executionId');
      const status = searchParams.get('status');
      const sessionId = searchParams.get('sessionId');
      const storefrontId = searchParams.get('storefrontId');
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
      const offset = (page - 1) * pageSize;

      // --- Single execution detail ---
      if (executionId) {
        const execution = await db.pipelineExecution.findUnique({
          where: { id: executionId },
        });

        if (!execution) {
          return error(new NotFoundError('Execution not found', executionId), timings.meta());
        }

        const logs = await db.pipelineLog.findMany({
          where: { executionId },
          orderBy: { timestamp: 'asc' },
        });

        logger.info('[PIPELINE_GET] Execution detail fetched', { executionId });

        return success({ execution, logs }, timings.meta());
      }

      // --- List executions with filters ---
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (sessionId) where.sessionId = sessionId;
      if (storefrontId) where.storefrontId = storefrontId;

      const [executions, totalCount] = await Promise.all([
        db.pipelineExecution.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          take: pageSize,
          skip: offset,
          select: {
            id: true,
            storefrontId: true,
            sessionId: true,
            status: true,
            currentStage: true,
            totalStages: true,
            progress: true,
            validationScore: true,
            errorMessage: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            _count: { select: { logs: true } },
          },
        }),
        db.pipelineExecution.count({ where }),
      ]);

      const [completedCount, failedCount, allExecutions] = await Promise.all([
        db.pipelineExecution.count({ where: { status: 'completed' } }),
        db.pipelineExecution.count({ where: { status: 'failed' } }),
        db.pipelineExecution.findMany({
          select: { durationMs: true, validationScore: true },
        }),
      ]);

      const avgDurationMs = allExecutions.length > 0
        ? Math.round(allExecutions.reduce((s, e) => s + (e.durationMs || 0), 0) / allExecutions.length)
        : 0;

      const withScores = allExecutions.filter(e => e.validationScore !== null);
      const avgValidationScore = withScores.length > 0
        ? Math.round(withScores.reduce((s, e) => s + (e.validationScore || 0), 0) / withScores.length)
        : 0;

      logger.info('[PIPELINE_GET] Pipeline executions listed', { total: totalCount, page, pageSize });

      return success({
        executions,
        pagination: { total: totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
        stats: {
          total: totalCount,
          completed: completedCount,
          failed: failedCount,
          avgDurationMs,
          avgValidationScore,
        },
      }, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
