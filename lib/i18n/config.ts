export const supportedLocales = ["fr", "en", "es", "pt", "de", "it", "nl", "ar", "ru", "zh-CN"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "fr";
export const defaultCountry = "SN";
export const defaultCurrency = "XOF";

export const supportedCurrencies = [
  "XOF",
  "EUR",
  "USD",
  "CAD",
  "GBP",
  "MAD",
  "AED",
  "JPY",
  "CNY",
  "RUB",
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];

export type CountryOption = {
  code: string;
  currency: SupportedCurrency;
  label: string;
  paymentMethods: string[];
  unitSystem: "metric" | "imperial";
};

export type LocalizationSettings = {
  country: string;
  currency: SupportedCurrency;
  direction: "ltr" | "rtl";
  locale: SupportedLocale;
  paymentMethods: string[];
  timeZone: string;
  unitSystem: "metric" | "imperial";
};

export const localeLabels: Record<SupportedLocale, string> = {
  ar: "العربية",
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  pt: "Português",
  ru: "Русский",
  "zh-CN": "简体中文",
};

export const countryOptions: CountryOption[] = [
  { code: "SN", currency: "XOF", label: "Sénégal", paymentMethods: ["Carte", "Mobile Money", "Espèces relais"], unitSystem: "metric" },
  { code: "CI", currency: "XOF", label: "Côte d'Ivoire", paymentMethods: ["Carte", "Mobile Money", "Espèces relais"], unitSystem: "metric" },
  { code: "FR", currency: "EUR", label: "France", paymentMethods: ["Carte", "SEPA", "Wallet"], unitSystem: "metric" },
  { code: "BE", currency: "EUR", label: "Belgique", paymentMethods: ["Carte", "SEPA", "Bancontact", "Wallet"], unitSystem: "metric" },
  { code: "ES", currency: "EUR", label: "Espagne", paymentMethods: ["Carte", "SEPA", "Wallet"], unitSystem: "metric" },
  { code: "PT", currency: "EUR", label: "Portugal", paymentMethods: ["Carte", "SEPA", "Wallet"], unitSystem: "metric" },
  { code: "DE", currency: "EUR", label: "Allemagne", paymentMethods: ["Carte", "SEPA", "Wallet"], unitSystem: "metric" },
  { code: "IT", currency: "EUR", label: "Italie", paymentMethods: ["Carte", "SEPA", "Wallet"], unitSystem: "metric" },
  { code: "GB", currency: "GBP", label: "Royaume-Uni", paymentMethods: ["Carte", "Wallet"], unitSystem: "imperial" },
  { code: "US", currency: "USD", label: "États-Unis", paymentMethods: ["Carte", "ACH", "Wallet"], unitSystem: "imperial" },
  { code: "CA", currency: "CAD", label: "Canada", paymentMethods: ["Carte", "Interac", "Wallet"], unitSystem: "metric" },
  { code: "MA", currency: "MAD", label: "Maroc", paymentMethods: ["Carte", "Virement", "Espèces relais"], unitSystem: "metric" },
  { code: "AE", currency: "AED", label: "Émirats arabes unis", paymentMethods: ["Carte", "Wallet"], unitSystem: "metric" },
  { code: "JP", currency: "JPY", label: "Japon", paymentMethods: ["Carte", "Wallet"], unitSystem: "metric" },
  { code: "CN", currency: "CNY", label: "Chine", paymentMethods: ["Carte", "Wallet"], unitSystem: "metric" },
  { code: "RU", currency: "RUB", label: "Russie", paymentMethods: ["Carte", "Wallet"], unitSystem: "metric" },
];

const localeAliases: Record<string, SupportedLocale> = {
  ar: "ar",
  de: "de",
  en: "en",
  es: "es",
  fr: "fr",
  it: "it",
  nl: "nl",
  pt: "pt",
  ru: "ru",
  zh: "zh-CN",
  "ar-ae": "ar",
  "de-de": "de",
  "en-ca": "en",
  "en-gb": "en",
  "en-us": "en",
  "es-es": "es",
  "fr-ca": "fr",
  "fr-fr": "fr",
  "fr-sn": "fr",
  "it-it": "it",
  "nl-be": "nl",
  "nl-nl": "nl",
  "pt-br": "pt",
  "pt-pt": "pt",
  "ru-ru": "ru",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
};

const countryByCode = new Map(countryOptions.map((country) => [country.code, country]));
const currencySet = new Set<string>(supportedCurrencies);
const timeZoneByCountry: Record<string, string> = { SN: "Africa/Dakar", CI: "Africa/Abidjan", FR: "Europe/Paris", BE: "Europe/Brussels", ES: "Europe/Madrid", PT: "Europe/Lisbon", DE: "Europe/Berlin", IT: "Europe/Rome", GB: "Europe/London", US: "America/New_York", CA: "America/Toronto", MA: "Africa/Casablanca", AE: "Asia/Dubai", JP: "Asia/Tokyo", CN: "Asia/Shanghai", RU: "Europe/Moscow" };

export function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return defaultLocale;

  const normalized = value.trim().replace("_", "-").toLowerCase();
  const exact = localeAliases[normalized];

  if (exact) return exact;

  const language = normalized.split("-")[0];
  return localeAliases[language] ?? defaultLocale;
}

export function localeDirection(locale: SupportedLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function normalizeCountry(value?: string | null) {
  const country = value?.trim().toUpperCase();
  return country && countryByCode.has(country) ? country : defaultCountry;
}

export function normalizeCurrency(value?: string | null): SupportedCurrency {
  const currency = value?.trim().toUpperCase();
  return currency && currencySet.has(currency) ? (currency as SupportedCurrency) : defaultCurrency;
}

export function detectLocaleFromAcceptLanguage(header?: string | null): SupportedLocale {
  const preferred = header
    ?.split(",")
    .map((part) => part.trim().split(";")[0])
    .find(Boolean);

  return normalizeLocale(preferred);
}

export function detectCountryFromHeaders(headers: { get(name: string): string | null }) {
  return normalizeCountry(
    headers.get("x-vercel-ip-country") ??
      headers.get("cf-ipcountry") ??
      headers.get("x-country") ??
      headers.get("x-user-country"),
  );
}

export function resolveLocaleSettings(input: {
  acceptLanguage?: string | null;
  country?: string | null;
  countryHeader?: string | null;
  currency?: string | null;
  locale?: string | null;
  timeZone?: string | null;
}): LocalizationSettings {
  const locale = normalizeLocale(input.locale ?? detectLocaleFromAcceptLanguage(input.acceptLanguage));
  const country = normalizeCountry(input.country ?? input.countryHeader);
  const countryOption = countryByCode.get(country) ?? countryByCode.get(defaultCountry)!;
  const currency = input.currency ? normalizeCurrency(input.currency) : countryOption.currency;

  return {
    country,
    currency,
    direction: localeDirection(locale),
    locale,
    paymentMethods: countryOption.paymentMethods,
    timeZone: input.timeZone?.trim() || timeZoneByCountry[country] || "UTC",
    unitSystem: countryOption.unitSystem,
  };
}

export function settingsForCountry(countryCode: string, current: LocalizationSettings): LocalizationSettings {
  const country = normalizeCountry(countryCode);
  const countryOption = countryByCode.get(country) ?? countryByCode.get(defaultCountry)!;

  return {
    ...current,
    country,
    currency: countryOption.currency,
    paymentMethods: countryOption.paymentMethods,
    timeZone: timeZoneByCountry[country] || current.timeZone,
    unitSystem: countryOption.unitSystem,
  };
}

export function settingsForLocale(localeCode: string, current: LocalizationSettings): LocalizationSettings {
  const locale = normalizeLocale(localeCode);

  return {
    ...current,
    direction: localeDirection(locale),
    locale,
  };
}

export function settingsForCurrency(currencyCode: string, current: LocalizationSettings): LocalizationSettings {
  return {
    ...current,
    currency: normalizeCurrency(currencyCode),
  };
}

export function formatLocalizedDate(value: Date | string | number, settings: LocalizationSettings) {
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: settings.timeZone,
  }).format(new Date(value));
}

export function formatLocalizedMoney(amount: number, settings: LocalizationSettings) {
  return new Intl.NumberFormat(settings.locale, {
    currency: settings.currency,
    style: "currency",
  }).format(amount);
}
