import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodType } from 'zod';

export type ParseJsonResult<T> =
  | { ok: true; data: T; response?: never }
  | { ok: false; data?: never; response: NextResponse };

export const jsonObjectSchema = z.record(z.string(), z.any());

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns a 400 NextResponse on malformed JSON or schema mismatch.
 */
export async function parseJsonBody<T = Record<string, any>>(
  req: NextRequest | Request,
  schema: ZodType<T> = jsonObjectSchema as unknown as ZodType<T>
): Promise<ParseJsonResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch (error) {
    console.warn('[RequestValidation] Malformed JSON body:', error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Dữ liệu JSON không hợp lệ' },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldPath = firstIssue?.path?.join('.') || 'body';
    const message = firstIssue?.message || 'Dữ liệu đầu vào không hợp lệ';
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Dữ liệu đầu vào không hợp lệ (${fieldPath}): ${message}`,
          details: parsed.error.issues,
        },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
