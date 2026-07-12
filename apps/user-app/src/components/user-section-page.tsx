import { notFound } from "next/navigation";
import type { OperationalWorkspaceConfig } from "@/components/dashboard/operational-workspace";
import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";
import { getWorkspaceConfig } from "@/lib/dashboard/workspace-configs";

const areaPrefixes = {
  client: "/client",
  transporter: "/transporter",
  traveler: "/traveler",
} as const;

type UserArea = keyof typeof areaPrefixes;

export function UserSectionPage({ area, section }: { area: UserArea; section: string }) {
  const config = getWorkspaceConfig(`${area}/${section}`);

  if (!config) {
    notFound();
  }

  return (
    <OperationalWorkspace
      config={rewriteConfigLinks(config, area)}
      returnTo={`${areaPrefixes[area]}/${section}`}
    />
  );
}

function rewriteConfigLinks(config: OperationalWorkspaceConfig, area: UserArea): OperationalWorkspaceConfig {
  return {
    ...config,
    actions: config.actions.map((action) => ({
      ...action,
      href: rewriteLegacyHref(action.href, area),
    })),
  };
}

function rewriteLegacyHref(href: string, area: UserArea) {
  const dashboardPrefix = `/dashboard/${area}`;

  if (href === dashboardPrefix || href.startsWith(`${dashboardPrefix}/`)) {
    return href.replace(dashboardPrefix, areaPrefixes[area]);
  }

  if (href === "/dashboard/kyc") {
    return area === "traveler" ? "/traveler/kyc" : area === "transporter" ? "/transporter/kyc" : "/client/profile";
  }

  return href;
}
