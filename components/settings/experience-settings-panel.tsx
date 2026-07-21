"use client";

import { Accessibility, Clock3, Eye, MoonStar } from "lucide-react";
import { LocalizationSwitcher } from "@/components/i18n/localization-switcher";
import { useLocalization } from "@/components/i18n/localization-provider";

const timeZones = ["UTC", "Africa/Dakar", "Africa/Abidjan", "Africa/Casablanca", "Europe/Paris", "Europe/Brussels", "Europe/London", "Europe/Madrid", "Europe/Lisbon", "Europe/Berlin", "Europe/Rome", "Europe/Moscow", "America/Toronto", "America/New_York", "Asia/Dubai", "Asia/Tokyo", "Asia/Shanghai"];

export function ExperienceSettingsPanel() {
  const { preferences, setAdPersonalization, setReducedMotion, setTheme, setTimeZone, settings } = useLocalization();
  return <section className="yb-card p-5 md:p-6" aria-labelledby="experience-settings-title">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Accessibility className="h-5 w-5" /></span><div><h2 id="experience-settings-title" className="text-xl font-black">Préférences d’affichage</h2><p className="mt-1 text-sm text-muted-foreground">Choisissez les formats qui vous conviennent.</p></div></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Setting label="Langue, pays et devise"><LocalizationSwitcher className="w-full flex-wrap bg-background" /></Setting>
      <Setting label="Fuseau horaire" icon={<Clock3 className="h-4 w-4" />}><select className="yb-field" value={settings.timeZone} onChange={(event) => setTimeZone(event.target.value)}>{timeZones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll("_", " ")}</option>)}</select></Setting>
      <Setting label="Thème" icon={<MoonStar className="h-4 w-4" />}><select className="yb-field" value={preferences.theme} onChange={(event) => setTheme(event.target.value as typeof preferences.theme)}><option value="system">Selon l’appareil</option><option value="light">Clair</option><option value="dark">Sombre</option></select></Setting>
      <div className="grid gap-3">
        <Toggle checked={preferences.reducedMotion} label="Réduire les mouvements" icon={<Accessibility className="h-4 w-4" />} onChange={setReducedMotion} />
        <Toggle checked={preferences.adPersonalization} label="Offres personnalisées" icon={<Eye className="h-4 w-4" />} onChange={setAdPersonalization} />
      </div>
    </div>
  </section>;
}

function Setting({ children, icon, label }: { children: React.ReactNode; icon?: React.ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm font-black"><span className="flex items-center gap-2">{icon}{label}</span>{children}</label>;
}

function Toggle({ checked, icon, label, onChange }: { checked: boolean; icon: React.ReactNode; label: string; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-sm font-black"><span className="flex items-center gap-2">{icon}{label}</span><input type="checkbox" className="h-5 w-5 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}
