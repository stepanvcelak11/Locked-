let enabled = true;
export function setHapticsEnabled(v: boolean) {
  enabled = v;
}
export function vibrate(pattern: number | number[]) {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
