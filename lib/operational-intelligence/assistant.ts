import { guardPrompt } from "./engine";

export type AssistantFact = { type: string; id: string; countryCode: string; label: string; value: string | number; source: string; observedAt: string };

export function answerOperationalQuestion(input: { question: string; facts: AssistantFact[]; allowedCountries: string[] }) {
  const guarded = guardPrompt(input.question);
  if (!guarded.safe) return { classification: "refusal" as const, answer: "Cette demande tente de contourner les contrôles. Aucun accès n’a été effectué.", citations: [], confidence: 100 };
  const scoped = input.facts.filter((fact) => input.allowedCountries.includes(fact.countryCode));
  const query = guarded.sanitized.toLocaleLowerCase("fr");
  const relevant = scoped.filter((fact) => query.includes(fact.type.toLocaleLowerCase("fr")) || query.includes(fact.id.toLocaleLowerCase("fr")) || query.split(/\s+/u).some((word) => word.length > 4 && fact.label.toLocaleLowerCase("fr").includes(word))).slice(0, 10);
  if (!relevant.length) return { classification: "fact" as const, answer: "Aucune donnée autorisée et pertinente ne permet de répondre. Je ne complète pas les informations manquantes.", citations: [], confidence: 0 };
  return {
    classification: "fact" as const,
    answer: relevant.map((fact) => `${fact.label}: ${String(fact.value)}`).join(" · "),
    citations: relevant.map((fact) => ({ object: `${fact.type}:${fact.id}`, source: fact.source, observedAt: fact.observedAt })),
    confidence: Math.max(30, 100 - relevant.length * 3),
  };
}
