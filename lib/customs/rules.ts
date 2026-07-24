import { z } from "zod";

export const customsRuleSchema = z.object({
  id: z.string().uuid(), version: z.number().int().positive(), countryCode: z.string().length(2), status: z.enum(["draft", "approved", "retired"]),
  effectiveFrom: z.string().date(), effectiveTo: z.string().date().nullable(), category: z.enum(["prohibited", "restricted", "dangerous", "permit_required", "value_threshold", "review_required"]),
  conditions: z.object({ originCountries: z.array(z.string().length(2)).optional(), destinationCountries: z.array(z.string().length(2)).optional(), hsPrefixes: z.array(z.string().regex(/^\d{2,10}$/u)).optional(), keywords: z.array(z.string().min(2).max(80)).optional(), minimumValue: z.number().nonnegative().optional(), maximumValue: z.number().positive().optional() }),
  validatedBy: z.string().uuid(), validatedAt: z.string().datetime({ offset: true }), sourceReference: z.string().trim().min(3).max(500),
});
export type CustomsRule = z.infer<typeof customsRuleSchema>;
export type CustomsRuleInput = { description: string; originCountry: string; destinationCountry: string; hsCode?: string | null; declaredValue: number; asOf: string };

export function evaluateCustomsRules(input: CustomsRuleInput, rules: CustomsRule[]) {
  return rules.map((rule) => customsRuleSchema.parse(rule)).filter((rule) => rule.status === "approved" && rule.effectiveFrom <= input.asOf && (!rule.effectiveTo || rule.effectiveTo >= input.asOf) && matches(rule, input)).map((rule) => ({ ruleId: rule.id, version: rule.version, category: rule.category, sourceReference: rule.sourceReference, requiresHumanReview: true as const }));
}
function matches(rule: CustomsRule, input: CustomsRuleInput) {
  const c = rule.conditions; const description = input.description.toLocaleLowerCase("fr");
  return rule.countryCode === input.destinationCountry && (!c.originCountries || c.originCountries.includes(input.originCountry)) && (!c.destinationCountries || c.destinationCountries.includes(input.destinationCountry)) && (!c.hsPrefixes || Boolean(input.hsCode && c.hsPrefixes.some((prefix) => input.hsCode?.startsWith(prefix)))) && (!c.keywords || c.keywords.some((keyword) => description.includes(keyword.toLocaleLowerCase("fr")))) && (c.minimumValue === undefined || input.declaredValue >= c.minimumValue) && (c.maximumValue === undefined || input.declaredValue <= c.maximumValue);
}

export const hsSuggestionSchema = z.object({ code: z.string().regex(/^\d{6,10}$/u), source: z.string().trim().min(2).max(200), confidence: z.number().min(0).max(1), explanation: z.string().trim().min(3).max(1000), legallyValidated: z.literal(false) });
export function createHsSuggestion(input: Omit<z.infer<typeof hsSuggestionSchema>, "legallyValidated">) { return hsSuggestionSchema.parse({ ...input, legallyValidated: false }); }

export function indicativeDutyEstimate(input: { taxableBase: number; rate: number; currency: string; source: string }) {
  if (!Number.isFinite(input.taxableBase) || input.taxableBase < 0 || !Number.isFinite(input.rate) || input.rate < 0) throw new Error("INVALID_INDICATIVE_DUTY_INPUT");
  return { amount: Math.round(input.taxableBase * input.rate), currency: input.currency, source: input.source, official: false as const, disclaimer: "Estimation indicative Yobalelma — le montant officiel relève de l’autorité compétente." };
}
