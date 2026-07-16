import type { SyntheticEvent } from "react";
import { imageUrl } from "@/services/course-catalog.service";

export function fallbackAvatar(name?: string | null, background = "0D9488"): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=${background}&color=ffffff`;
}

export function avatarUrl(
  avatar?: string | null,
  name?: string | null,
  background = "0D9488"
): string {
  if (!avatar) return fallbackAvatar(name, background);

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  return imageUrl(avatar);
}

export function applyFallbackAvatar(
  event: SyntheticEvent<HTMLImageElement>,
  name?: string | null,
  background = "0D9488"
) {
  const fallback = fallbackAvatar(name, background);

  if (event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback;
  }
}
