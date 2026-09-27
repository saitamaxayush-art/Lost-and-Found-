import { useEffect, useState } from "react";

// Returns a value that only updates `delay` ms after the input value has
// stopped changing. Used so the search doesn't re-run on every keystroke —
// it waits until the user pauses typing.
export function useDebouncedValue(value, delay = 550) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
