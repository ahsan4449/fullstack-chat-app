/**
 * useSecurity — Screenshot Detection Hook
 *
 * Detects screenshot attempts (PrintScreen, Cmd+Shift+4, window blur)
 * and notifies the OTHER user in the chat via socket.
 * No blur, no trust score — just a silent notification to the target.
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";

export const useSecurity = ({ targetUserId = null, enabled = true } = {}) => {
  const { socket } = useAuthStore();
  const cooldownRef = useRef(false); // Prevent rapid duplicate events

  // ── Emit screenshot event → server forwards to targetUserId ───────────
  const reportScreenshot = useCallback(() => {
    if (!enabled || !socket || !targetUserId || cooldownRef.current) return;

    // 3-second cooldown to avoid flooding
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    socket.emit("screenshotDetected", { targetUserId });
  }, [enabled, socket, targetUserId]);

  // ── Keyboard listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const isPrintScreen = e.key === "PrintScreen";
      const isMacScreenshot = e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
      const isWindowsSnip = (e.ctrlKey || e.altKey) && e.key === "PrintScreen";
      const isSnipShortcut = e.ctrlKey && e.shiftKey && e.key === "S";

      if (isPrintScreen || isMacScreenshot || isWindowsSnip || isSnipShortcut) {
        e.preventDefault();
        reportScreenshot();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, reportScreenshot]);

  // ── Window blur (focus lost to another app / snipping tool) ───────────
  useEffect(() => {
    if (!enabled) return;

    let lastFocusTime = Date.now();

    const handleFocus = () => { lastFocusTime = Date.now(); };
    const handleBlur = () => {
      if (Date.now() - lastFocusTime > 500) reportScreenshot();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, reportScreenshot]);

  // ── Visibility change (tab switch / OS capture tools) ─────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") reportScreenshot();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, reportScreenshot]);
};

export default useSecurity;
