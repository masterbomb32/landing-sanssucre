import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    done: ms === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Countdown({
  targetISO,
  compact = false,
  className = "",
}: {
  targetISO: string;
  compact?: boolean;
  className?: string;
}) {
  const target = new Date(targetISO).getTime();
  const [t, setT] = useState(() => diff(target));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;
  if (!mounted) return <span className={className} suppressHydrationWarning />;

  if (t.done) {
    return (
      <div className={`text-center font-display text-sm font-semibold text-primary ${className}`}>
        We're open!
      </div>
    );
  }

  if (compact) {
    return (
      <span className={`inline-flex items-baseline gap-1 font-mono tabular-nums ${className}`}>
        <span>{t.d}d</span>
        <span>{pad(t.h)}h</span>
        <span>{pad(t.m)}m</span>
        <span>{pad(t.s)}s</span>
      </span>
    );
  }

  const cell = "flex flex-col items-center rounded-md bg-primary/10 px-2.5 py-1.5 min-w-[3rem]";
  const num = "font-display text-lg font-bold leading-none tabular-nums text-primary sm:text-xl";
  const lbl = "mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground";
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <div className={cell}><span className={num}>{t.d}</span><span className={lbl}>days</span></div>
      <div className={cell}><span className={num}>{pad(t.h)}</span><span className={lbl}>hrs</span></div>
      <div className={cell}><span className={num}>{pad(t.m)}</span><span className={lbl}>min</span></div>
      <div className={cell}><span className={num}>{pad(t.s)}</span><span className={lbl}>sec</span></div>
    </div>
  );
}