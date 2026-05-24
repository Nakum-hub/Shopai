import { NextRequest } from 'next/server';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, createResponseTimings } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    logger.info('[ROOT_GET] Health check');

    return success(
      { message: 'StoreCraft AI is running', version: '2.0.0' },
      timings.meta(),
    );
  });
}
