// =============================================================================
// Registration API Route
// =============================================================================
// POST /api/auth/register
// Body: { email, password, name? }
//
// Creates a new user account with hashed password.
// Does NOT automatically sign in — user must then sign in via /api/auth/signin.
// =============================================================================

import { NextRequest } from 'next/server';
import { createUser } from '@/lib/auth';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, error, createResponseTimings, created } from '@/lib/api-response';
import { errorHandler, ValidationError } from '@/lib/errors';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const body = await request.json();
      const validation = validateInput(registerSchema, body);

      if (!validation.success) {
        return error(new ValidationError(validation.error), timings.meta());
      }

      const { email, password, name } = validation.data;

      try {
        const user = await createUser({ email, password, name });

        logger.info('[AUTH_REGISTER] User registered', {
          userId: user.id,
          email: user.email,
        });

        return created(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            message: 'Account created successfully. Please sign in.',
          },
          timings.meta()
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        return error(new ValidationError(message), timings.meta());
      }
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
