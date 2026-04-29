import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete, Lock } from "lucide-react";

interface Props {
  expectedPin: string;
  onUnlock: () => void;
  title?: string;
  hint?: string;
}

export function PinPad({ expectedPin, onUnlock, title = "Staff PIN", hint }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const press = (d: string) => {
    setError(false);
    const next = (pin + d).slice(0, expectedPin.length);
    setPin(next);
    if (next.length === expectedPin.length) {
      if (next === expectedPin) {
        setTimeout(() => onUnlock(), 120);
      } else {
        setError(true);
        setTimeout(() => setPin(""), 600);
      }
    }
  };

  const back = () => {
    setError(false);
    setPin((p) => p.slice(0, -1));
  };

  const dots = Array.from({ length: expectedPin.length });

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
        <div />
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold"
          onClick={() => press("0")}
        >
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-14"
          onClick={back}
          aria-label="Delete"
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}