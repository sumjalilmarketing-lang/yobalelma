"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  formatLocalizedDate,
  formatLocalizedMoney,
  resolveLocaleSettings,
  settingsForCountry,
  settingsForCurrency,
  settingsForLocale,
  type LocalizationSettings,
} from "@/lib/i18n/config";

type LocalizationContextValue = {
  formatDate: (value: Date | string | number) => string;
  formatMoney: (amount: number) => string;
  setCountry: (country: string) => void;
  setCurrency: (currency: string) => void;
  setLocale: (locale: string) => void;
  setTimeZone: (timeZone: string) => void;
  setTheme: (theme: ExperiencePreferences["theme"]) => void;
  setAdPersonalization: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  preferences: ExperiencePreferences;
  settings: LocalizationSettings;
};

export type ExperiencePreferences = {
  adPersonalization: boolean;
  reducedMotion: boolean;
  theme: "system" | "light" | "dark";
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

const storageKeys = {
  country: "yobalelma.country",
  currency: "yobalelma.currency",
  locale: "yobalelma.locale",
  timeZone: "yobalelma.time-zone",
  theme: "yobalelma.theme",
  adPersonalization: "yobalelma.ads.personalized",
  reducedMotion: "yobalelma.accessibility.reduced-motion",
};

export function LocalizationProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: LocalizationSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [preferences, setPreferences] = useState<ExperiencePreferences>({ adPersonalization: false, reducedMotion: false, theme: "system" });

  useEffect(() => {
    const browserLocale = navigator.languages?.[0] ?? navigator.language;
    const timeZone = localStorage.getItem(storageKeys.timeZone) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

    setSettings(
      resolveLocaleSettings({
        country: localStorage.getItem(storageKeys.country) ?? initialSettings.country,
        currency: localStorage.getItem(storageKeys.currency) ?? initialSettings.currency,
        locale: localStorage.getItem(storageKeys.locale) ?? browserLocale ?? initialSettings.locale,
        timeZone: timeZone || initialSettings.timeZone,
      }),
    );
    const theme = (localStorage.getItem(storageKeys.theme) as ExperiencePreferences["theme"] | null) ?? "system";
    const reducedMotion = localStorage.getItem(storageKeys.reducedMotion) === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPreferences({
      adPersonalization: localStorage.getItem(storageKeys.adPersonalization) === "true",
      reducedMotion,
      theme,
    });
  }, [initialSettings.country, initialSettings.currency, initialSettings.locale, initialSettings.timeZone]);

  useEffect(() => {
    document.documentElement.lang = settings.locale;
    document.documentElement.dir = settings.direction;
    document.documentElement.dataset.ybCountry = settings.country;
  }, [settings.country, settings.direction, settings.locale]);

  useEffect(() => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", preferences.theme === "dark" || (preferences.theme === "system" && systemDark));
    document.documentElement.dataset.ybReducedMotion = preferences.reducedMotion ? "true" : "false";
  }, [preferences.reducedMotion, preferences.theme]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      formatDate: (input) => formatLocalizedDate(input, settings),
      formatMoney: (amount) => formatLocalizedMoney(amount, settings),
      setCountry: (country) => {
        setSettings((current) => {
          const next = settingsForCountry(country, current);
          localStorage.setItem(storageKeys.country, next.country);
          localStorage.setItem(storageKeys.currency, next.currency);
          return next;
        });
      },
      setCurrency: (currency) => {
        setSettings((current) => {
          const next = settingsForCurrency(currency, current);
          localStorage.setItem(storageKeys.currency, next.currency);
          return next;
        });
      },
      setLocale: (locale) => {
        setSettings((current) => {
          const next = settingsForLocale(locale, current);
          localStorage.setItem(storageKeys.locale, next.locale);
          document.documentElement.lang = next.locale;
          document.documentElement.dir = next.direction;
          return next;
        });
      },
      setTimeZone: (timeZone) => {
        const safeTimeZone = Intl.supportedValuesOf?.("timeZone").includes(timeZone) ? timeZone : "UTC";
        localStorage.setItem(storageKeys.timeZone, safeTimeZone);
        setSettings((current) => ({ ...current, timeZone: safeTimeZone }));
      },
      setTheme: (theme) => {
        localStorage.setItem(storageKeys.theme, theme);
        setPreferences((current) => ({ ...current, theme }));
      },
      setAdPersonalization: (enabled) => {
        localStorage.setItem(storageKeys.adPersonalization, String(enabled));
        setPreferences((current) => ({ ...current, adPersonalization: enabled }));
      },
      setReducedMotion: (enabled) => {
        localStorage.setItem(storageKeys.reducedMotion, String(enabled));
        setPreferences((current) => ({ ...current, reducedMotion: enabled }));
      },
      preferences,
      settings,
    }),
    [preferences, settings],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error("useLocalization must be used inside LocalizationProvider.");
  }

  return context;
}
