import { NextResponse } from 'next/server';

export interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function apiSuccess<T>(data: T, extra?: Record<string, any>, options?: ApiResponseOptions) {
  return NextResponse.json(
    {
      success: true,
      ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data }),
      ...(extra || {}),
    },
    {
      status: options?.status || 200,
      headers: options?.headers,
    }
  );
}

export function apiError(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(extra || {}),
    },
    { status }
  );
}
