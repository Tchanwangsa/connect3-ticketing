"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoSaveOptions {
  /** Whether auto-save is active */
  enabled: boolean;
  /** The save function to call. Must capture latest state via ref. */
  onSave: () => Promise<void>;
  /** Debounce delay in ms (default: 2000) */
  delay?: number;
}

/**
 * Debounced auto-save hook.
 *
 * Call `markDirty()` whenever saveable data changes.
 * After `delay` ms of inactivity the save function fires automatically.
 * Call `flush()` to save immediately (e.g. on navigate-away).
 */
export function useAutoSave({
  enabled,
  onSave,
  delay = 2000,
}: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingRef = useRef(false);
  const saveRef = useRef(onSave);

  // Always keep the save function up-to-date so the timer
  // callback captures the latest form state.
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const doSave = useCallback(async () => {
    if (savingRef.current || !dirtyRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await saveRef.current();
      dirtyRef.current = false;
    } catch (err) {
      console.error("[auto-save] failed:", err);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  /** Mark the form as dirty and (re)start the debounce timer. */
  const markDirty = useCallback(() => {
    if (!enabled) return;
    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
  }, [enabled, delay, doSave]);

  /** Immediately persist any pending changes (cancels timer). */
  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (dirtyRef.current) {
      await doSave();
    }
  }, [doSave]);

  /** Cancel the pending timer without saving. */
  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    dirtyRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { markDirty, flush, cancel, dirtyRef, isSaving };
}
