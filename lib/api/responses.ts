import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResult<T = unknown> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ok<T>(message: string, data?: T) {
  return NextResponse.json<ApiResult<T>>({ ok: true, message, data });
}

export function fail(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json<ApiResult>(
    { ok: false, message, fieldErrors },
    { status },
  );
}

export function validationFail(error: ZodError) {
  const fieldErrors = Object.fromEntries(
    error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );

  return fail("Les informations envoyees sont invalides.", 422, fieldErrors);
}
