type Environment = Record<string, string | undefined>;

export function shouldExposeTestOtp(env: Environment = process.env) {
  return env.NODE_ENV !== "production" && env.YOBALELMA_EXPOSE_TEST_OTP === "1";
}
