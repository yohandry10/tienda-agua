export const MOTION_CHANGE_EVENT = "vaiyo:motion-change";
export const MOTION_STORAGE_KEY = "vaiyo-motion";

export function motionEnabled() {
  return document.documentElement.dataset.vaiyoMotion !== "off";
}
