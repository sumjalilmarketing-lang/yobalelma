import { describe, expect, it } from "vitest";
import {
  defaultCountry,
  detectLocaleFromAcceptLanguage,
  formatLocalizedMoney,
  localeDirection,
  resolveLocaleSettings,
  settingsForCountry,
  settingsForCurrency,
  settingsForLocale,
} from "@/lib/i18n/config";

describe("Yobalelma localization", () => {
  it("detects supported browser languages from Accept-Language", () => {
    expect(detectLocaleFromAcceptLanguage("es-ES,es;q=0.9,fr;q=0.8")).toBe("es");
    expect(detectLocaleFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.7")).toBe("zh-CN");
    expect(detectLocaleFromAcceptLanguage("ar-AE,fr;q=0.7")).toBe("ar");
  });

  it("keeps language, country and currency independently editable", () => {
    const initial = resolveLocaleSettings({
      acceptLanguage: "fr-FR,fr;q=0.9",
      countryHeader: "SN",
      timeZone: "Europe/Paris",
    });
    const english = settingsForLocale("en-US", initial);
    const canada = settingsForCountry("CA", english);
    const euro = settingsForCurrency("EUR", canada);

    expect(euro.locale).toBe("en");
    expect(euro.country).toBe("CA");
    expect(euro.currency).toBe("EUR");
    expect(euro.paymentMethods).toContain("Interac");
  });

  it("supports RTL language direction", () => {
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("fr")).toBe("ltr");
  });

  it("falls back safely for unsupported countries and formats money", () => {
    const settings = resolveLocaleSettings({
      countryHeader: "XX",
      currency: "CAD",
      locale: "fr",
      timeZone: "UTC",
    });

    expect(settings.country).toBe(defaultCountry);
    expect(formatLocalizedMoney(125.5, settings)).toContain("125");
    expect(settings.currency).toBe("CAD");
  });
});
