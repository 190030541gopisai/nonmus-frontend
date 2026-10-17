import { useCallback, useEffect, useState } from "react";

function useCountdown(initialSeconds: number | null) {
  const [remaining, setRemaining] = useState<number>(initialSeconds ?? 0);

  // Sync remaining to initialSeconds whenever the caller resets the countdown
  useEffect(() => {
    if (initialSeconds !== null) setRemaining(initialSeconds);
  }, [initialSeconds]);

  // Tick down by one every second until exhausted
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const reset = useCallback((seconds: number) => setRemaining(seconds), []);

  return { remaining, reset };
}

export default useCountdown;
