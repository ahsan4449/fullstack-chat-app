/**
 * SelfDestructTimer — Countdown display for self-destructing messages.
 * Shows a ticking timer badge on the message bubble.
 * When countdown hits 0, the message fades out (actual deletion is backend-driven).
 */

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const SelfDestructTimer = ({ expiresAt, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;

    const calculate = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && onExpire) onExpire();
    };

    calculate(); // Run immediately
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (secondsLeft === null || !expiresAt) return null;

  // Color shifts from green → yellow → red as time runs out
  const color =
    secondsLeft > 30
      ? "text-emerald-400"
      : secondsLeft > 10
      ? "text-yellow-400"
      : "text-red-400 animate-pulse";

  const format = (s) => {
    if (s >= 3600) return `${Math.floor(s / 3600)}h`;
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-mono mt-1 ${color}`}
      title="This message will self-destruct"
    >
      <Timer className="size-3" />
      {format(secondsLeft)}
    </span>
  );
};

export default SelfDestructTimer;
