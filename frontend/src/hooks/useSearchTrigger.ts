import { useCallback, useEffect, useRef, useState } from 'react';

// Powers "search as you type, but also let me press a button" — the
// most common complaint about pure debounced search is that it's not
// obvious anything is happening until the list changes. This gives you
// both: typing still auto-searches after a short pause (unchanged
// behavior), AND `searchNow()` fires the exact same search immediately,
// for a Search button or pressing Enter.
//
// `trigger` is a bump counter, not the search text itself — put it in a
// fetch effect's dependency array so the fetch only actually runs on
// trigger changes (the debounced pause, or a manual call to
// searchNow()), never on every keystroke. `valueRef` always holds the
// latest text, so the fetch reads a fresh value even though the fetch
// callback itself isn't recreated on every keystroke.
export const useSearchTrigger = (value: string, delayMs = 400) => {
  const [trigger, setTrigger] = useState(0);
  const valueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setTrigger((n) => n + 1), delayMs);
    return () => clearTimeout(timerRef.current);
  }, [value, delayMs]);

  // Firing a search immediately (button click / Enter) makes the
  // still-pending auto-search timer redundant — clear it so it doesn't
  // fire a duplicate fetch a moment later with the same value.
  const searchNow = useCallback(() => {
    clearTimeout(timerRef.current);
    setTrigger((n) => n + 1);
  }, []);

  return { trigger, valueRef, searchNow };
};
