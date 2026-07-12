import {
  isPlatformRole,
  type PlatformRole,
} from "../../../lib/auth/roles";
import {
  appManifestById,
  type YobalelmaAppId,
} from "../../config/src/app-manifests";

export function canAccessYobalelmaApp(appId: YobalelmaAppId, role: string) {
  if (!isPlatformRole(role)) {
    return false;
  }

  const manifest = appManifestById(appId);

  return Boolean(manifest?.roles.includes(role as never));
}

export function allowedRolesForApp(appId: YobalelmaAppId): PlatformRole[] {
  const manifest = appManifestById(appId);

  return manifest?.roles.filter(isPlatformRole) ?? [];
}
