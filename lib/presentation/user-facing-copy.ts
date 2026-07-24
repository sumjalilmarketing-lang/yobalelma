const technicalMessagePattern = /(?:\bsupabase\b|\bpostgres(?:ql)?\b|\bdatabase\b|\bbackend\b|\bserver\b|\bserveur\b|\bschema\b|\btable\b|\bcolumn\b|\brelation\b|\bbucket\b|\bstorage\b|\brpc\b|\bsql\b|\bjwt\b|\brow[- ]level\b|\bpolicy\b|\bpayload\b|\bjson\b|\bundefined\b|\bnull\b|[a-z][a-z0-9]*_[a-z0-9_]+|\{[^}]*\}|\bstack\b)/i;

const knownMessages: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /invalid (?:login )?credentials|invalid email or password|wrong password/i,
    message: "L’adresse e-mail ou le mot de passe est incorrect.",
  },
  {
    pattern: /email not confirmed/i,
    message: "Confirme ton adresse e-mail avant de te connecter.",
  },
  {
    pattern: /user already registered|already exists/i,
    message: "Un compte existe déjà avec cette adresse e-mail.",
  },
  {
    pattern: /rate limit|too many requests|too many attempts/i,
    message: "Trop de tentatives ont été effectuées. Réessaie dans quelques minutes.",
  },
  {
    pattern: /failed to fetch|network|fetch failed|timeout|timed out/i,
    message: "La connexion à Yobalelma a été interrompue. Vérifie ta connexion puis réessaie.",
  },
];

export const DEFAULT_USER_ERROR =
  "Nous ne pouvons pas terminer cette action pour le moment. Réessaie dans quelques instants.";

export function toUserFacingMessage(message: string | undefined, fallback = DEFAULT_USER_ERROR) {
  const normalized = message?.trim();

  if (!normalized) {
    return fallback;
  }

  const known = knownMessages.find(({ pattern }) => pattern.test(normalized));

  if (known) {
    return known.message;
  }

  return technicalMessagePattern.test(normalized) ? fallback : normalized;
}
