"use client";

import { useEffect } from "react";

/**
 * Syncs the `dark` class on `<html>` so Radix portals (popovers, dialogs,
 * sheets) inherit the correct CSS variable theme. Without this, portaled
 * content renders with light-mode variables even when the page is dark,
 * because portals are appended to `<body>` outside the themed container.
 *
 * Cleans up on unmount (removes the class if it wasn't already set).
 */
export function useDocumentDark(isDark: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    return () => {
      // Restore previous state on unmount
      if (hadDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
  }, [isDark]);
}
