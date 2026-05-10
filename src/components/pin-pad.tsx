import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Delete, Loader2, Lock } from "lucide-react";

interface Props {
  /** Async verifier — returns true on success. The PIN value never leaves this component on failure. */
  onVerify: (pin: string) => Promise<boolean>;
  onUnlock: () => void;
  title?: string;
  hint?: string;
  /** Maximum digits accepted (PIN may be 4–maxLength). */
  maxLength?: number;
}

export function PinPad({ onVerify, onUnlock, title = "Staff PIN", hint, maxLength = 6 }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    if (busy || value.length < 4) return;
    setBusy(true);
    const ok = await onVerify(value);
    setBusy(false);
    if (ok) {
      setTimeout(() => onUnlock(), 120);
    } else {
      setError(true);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 700);
    }
  };

  const press = (d: string) => {
    if (busy) return;
    setError(false);
    const next = (pin + d).slice(0, maxLength);
    setPin(next);
    if (next.length === maxLength) {
      void submit(next);
    }
  };

  const back = () => {
    if (busy) return;
    setError(false);
    setPin((p) => p.slice(0, -1));
  };

  const dots = Array.from({ length: maxLength });

  return (
    <div className="mx-auto w-full max-w-xs text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div
        className={`mt-6 flex justify-center gap-3 ${error ? "animate-pulse" : ""}`}
        aria-label="PIN entry"
      >
        {dots.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border ${
              i < pin.length ? (error ? "bg-destructive border-destructive" : "bg-foreground border-foreground") : "border-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">Incorrect PIN</p>}
      {busy && !error && <p className="mt-2 text-xs text-muted-foreground">Verifying…</p>}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {["1","2","3","4","5","6","7","8","9"].map((n) => (
          <Button
            key={n}
            type="button"
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => press(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-14"
          onClick={back}
          aria-label="Delete"
          disabled={busy || pin.length === 0}
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold"
          onClick={() => press("0")}
          disabled={busy}
        >
          0
        </Button>
        <Button
          type="button"
          variant="default"
          className="h-14"
          onClick={() => submit(pin)}
          disabled={busy || pin.length < 4}
          aria-label="Submit PIN"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}