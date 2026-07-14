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
  settings: LocalizationSettings;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

const storageKeys = {
  country: "yobalelma.country",
  currency: "yobalelma.currency",
  locale: "yobalelma.locale",
};

export function LocalizationProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: LocalizationSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const browserLocale = navigator.languages?.[0] ?? navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setSettings(
      resolveLocaleSettings({
        country: localStorage.getItem(storageKeys.country) ?? initialSettings.country,
        currency: localStorage.getItem(storageKeys.currency) ?? initialSettings.currency,
        locale: localStorage.getItem(storageKeys.locale) ?? browserLocale ?? initialSettings.locale,
        timeZone: timeZone || initialSettings.timeZone,
      }),
    );
  }, [initialSettings.country, initialSettings.currency, initialSettings.locale, initialSettings.timeZone]);

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
      settings,
    }),
    [settings],
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
