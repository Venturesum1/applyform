"use client";

import { useEffect } from "react";

/**
 * Cosmetic-only deterrent: blocks the right-click menu and common DevTools
 * shortcuts. This is NOT real security — anyone can still open DevTools via
 * the browser menu, a different browser, or curl the API directly. The
 * actual protection is server-side auth on every admin/API route; this just
 * discourages casual snooping.
 */
function isBlockedShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();

  if (key === "f12") return true;

  const modified = event.ctrlKey || event.metaKey;
  const withShiftOrAlt = event.shiftKey || event.altKey;

  // DevTools / console / element picker: Ctrl+Shift+I|J|C (Win/Linux), Cmd+Option+I|J|C (Mac)
  if (modified && withShiftOrAlt && ["i", "j", "c"].includes(key)) return true;

  // View source: Ctrl+U
  if (event.ctrlKey && !event.shiftKey && key === "u") return true;

  return false;
}

export function NoInspect() {
  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlockedShortcut(event)) {
        event.preventDefault();
      }
    }

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
