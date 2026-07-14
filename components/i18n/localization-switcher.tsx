"use client";

import { CreditCard, Globe2, MapPin } from "lucide-react";
import { countryOptions, localeLabels, supportedCurrencies, supportedLocales } from "@/lib/i18n/config";
import { useLocalization } from "@/components/i18n/localization-provider";
import { cn } from "@/lib/utils";

export function LocalizationSwitcher({ className }: { className?: string }) {
  const { setCountry, setCurrency, setLocale, settings } = useLocalization();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-black/10 bg-white/75 p-1 text-black shadow-line",
        className,
      )}
      aria-label="Preferences internationales"
    >
      <CompactSelect
        ariaLabel="Langue"
        icon={Globe2}
        value={settings.locale}
        onChange={setLocale}
        options={supportedLocales.map((locale) => ({
          label: localeLabels[locale],
          value: locale,
        }))}
      />
      <CompactSelect
        ariaLabel="Pays"
        icon={MapPin}
        value={settings.country}
        onChange={setCountry}
        options={countryOptions.map((country) => ({
          label: country.label,
          value: country.code,
        }))}
      />
      <CompactSelect
        ariaLabel="Devise"
        icon={CreditCard}
        value={settings.currency}
        onChange={setCurrency}
        options={supportedCurrencies.map((currency) => ({
          label: currency,
          value: currency,
        }))}
      />
    </div>
  );
}

function CompactSelect({
  ariaLabel,
  icon: Icon,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  icon: typeof Globe2;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="relative flex items-center">
      <Icon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <select
        aria-label={ariaLabel}
        className="h-8 max-w-[8.5rem] rounded-md border border-transparent bg-transparent py-1 pl-7 pr-2 text-xs font-black outline-none transition hover:bg-muted focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
