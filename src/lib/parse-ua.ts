export type OS = "Windows" | "macOS" | "iOS" | "Android" | "Linux" | "Other";
export type Device = "Mobile" | "Tablet" | "Desktop";

export function parseUA(ua: string | null | undefined): { os: OS; device: Device } {
  const u = (ua ?? "").toLowerCase();
  let os: OS = "Other";
  if (/windows/.test(u)) os = "Windows";
  else if (/iphone|ipad|ipod|ios/.test(u)) os = "iOS";
  else if (/android/.test(u)) os = "Android";
  else if (/mac os|macintosh/.test(u)) os = "macOS";
  else if (/linux/.test(u)) os = "Linux";

  let device: Device = "Desktop";
  if (/ipad|tablet|playbook|silk/.test(u) || (/android/.test(u) && !/mobile/.test(u))) {
    device = "Tablet";
  } else if (/mobi|iphone|ipod|android.*mobile|phone/.test(u)) {
    device = "Mobile";
  }
  return { os, device };
}