import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

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

export async function readJsonRequest(
  request: Request,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse<ApiResult> }
> {
  try {
    return {
      data: await request.json(),
      ok: true,
    };
  } catch {
    return {
      ok: false,
      response: fail("Le corps JSON est invalide.", 400),
    };
  }
}

export async function parseJsonRequest<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; response: NextResponse<ApiResult> }
> {
  const body = await readJsonRequest(request);

  if (!body.ok) {
    return body;
  }

  const parsed = schema.safeParse(body.data);

  if (!parsed.success) {
    return {
      ok: false,
      response: validationFail(parsed.error),
    };
  }

  return {
    data: parsed.data,
    ok: true,
  };
}
