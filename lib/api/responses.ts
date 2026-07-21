import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { toUserFacingMessage } from "@/lib/presentation/user-facing-copy";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 256 * 1024;

export type ApiResult<T = unknown> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ok<T>(message: string, data?: T) {
  return NextResponse.json<ApiResult<T>>({ ok: true, message, data });
}

export function fail(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json<ApiResult>(
    { ok: false, message: toUserFacingMessage(message), fieldErrors },
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
  options: { maxBytes?: number } = {},
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse<ApiResult> }
> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_LIMIT_BYTES;
  const contentLength = request.headers.get("content-length");
  const contentType = request.headers.get("content-type");

  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);

    if (Number.isFinite(size) && size > maxBytes) {
      return {
        ok: false,
        response: fail("Le corps JSON est trop volumineux.", 413),
      };
    }
  }

  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: fail("Le type de contenu doit etre application/json.", 415),
    };
  }

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
  options: { maxBytes?: number } = {},
): Promise<
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; response: NextResponse<ApiResult> }
> {
  const body = await readJsonRequest(request, options);

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
