/**
 * Device detection utilities for responsive UI
 */

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  const isTabletUA = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);

  return isTabletUA;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if app is running in standalone mode (PWA)
  return (
    // @ts-ignore
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true
  );
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv';

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  // TV detection (large screen, no touch)
  if (window.innerWidth >= 1920 && !isTouchDevice()) {
    return 'tv';
  }

  if (isMobile() && !isTablet()) {
    return 'mobile';
  }

  if (isTablet()) {
    return 'tablet';
  }

  return 'desktop';
}
