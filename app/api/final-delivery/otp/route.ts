import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { shouldExposeTestOtp } from "@/lib/final-delivery/otp-visibility";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  deliveryOtpGenerateSchema,
  deliveryOtpRevokeSchema,
  deliveryOtpVerifySchema,
} from "@/lib/validation/final-delivery";

type GenerateOtpResult = {
  otp_id: string;
  otp_code: string;
  expires_at: string;
};

type VerifyOtpResult = {
  verified: boolean;
  proof_id: string | null;
  order_id: string;
  status: string;
};

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, deliveryOtpGenerateSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour generer un OTP.", 401);
  }

  const { data, error } = await callSupabaseRpc<GenerateOtpResult[]>(
    supabase,
    "generate_delivery_otp",
    {
      p_channel: parsed.data.channel,
      p_delivery_mode: parsed.data.deliveryMode,
      p_shipment_id: parsed.data.shipmentId,
      p_ttl_minutes: parsed.data.ttlMinutes,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  const otp = data?.[0] ?? null;

  return ok("OTP genere et journalise.", {
    expiresAt: otp?.expires_at,
    otpCodeForTestOnly: shouldExposeTestOtp() ? otp?.otp_code : undefined,
    otpId: otp?.otp_id,
  });
}

export async function PATCH(request: Request) {
  const parsed = await parseJsonRequest(request, deliveryOtpVerifySchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour verifier un OTP.", 401);
  }

  const { data, error } = await callSupabaseRpc<VerifyOtpResult[]>(
    supabase,
    "verify_delivery_otp",
    {
      p_delivery_mode: parsed.data.deliveryMode,
      p_mission_id: parsed.data.missionId || undefined,
      p_note: parsed.data.note || undefined,
      p_otp_code: parsed.data.otpCode,
      p_photo_path: parsed.data.photoPath || undefined,
      p_recipient_name: parsed.data.recipientName || undefined,
      p_recipient_phone_last4: parsed.data.recipientPhoneLast4 || undefined,
      p_shipment_id: parsed.data.shipmentId,
      p_signature_path: parsed.data.signaturePath || undefined,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  const result = data?.[0] ?? null;

  if (!result?.verified) {
    return fail("OTP refuse. La tentative a ete journalisee.", 400);
  }

  return ok("OTP valide, preuve de remise creee.", result);
}

export async function DELETE(request: Request) {
  const parsed = await parseJsonRequest(request, deliveryOtpRevokeSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour revoquer un OTP.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "revoke_delivery_otp",
    {
      p_otp_id: parsed.data.otpId,
      p_reason: parsed.data.reason,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("OTP revoque.", { otpId: data });
}
