import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/pipeline — List all pipeline executions with optional filters
 * Query params: ?status=completed&limit=20&offset=0&sessionId=xxx
 * Also supports ?executionId=xxx to get a single execution with all logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');
    const storefrontId = searchParams.get('storefrontId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // --- Single execution detail ---
    if (executionId) {
      const execution = await db.pipelineExecution.findUnique({
        where: { id: executionId },
      });

      if (!execution) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
      }

      const logs = await db.pipelineLog.findMany({
        where: { executionId },
        orderBy: { timestamp: 'asc' },
      });

      return NextResponse.json({ execution, logs });
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
        take: limit,
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

    // Compute aggregate stats across ALL executions (not just the filtered page)
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

    return NextResponse.json({
      executions,
      pagination: { total: totalCount, limit, offset },
      stats: {
        total: totalCount,
        completed: completedCount,
        failed: failedCount,
        avgDurationMs,
        avgValidationScore,
      },
    });
  } catch (error) {
    console.error('[PIPELINE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline executions' }, { status: 500 });
  }
}
