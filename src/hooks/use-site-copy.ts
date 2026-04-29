import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { siteCopy as defaults } from "@/lib/site-copy";

type Copy = typeof defaults;

function setByPath(obj: any, path: string, value: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...(cur[parts[i]] ?? {}) };
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export function useSiteCopy(): Copy {
  const [copy, setCopy] = useState<Copy>(defaults);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      if (cancelled || !data?.length) return;
      const merged = clone(defaults) as any;
      for (const row of data) {
        let v: string | undefined;
        if (typeof row.value === "string") v = row.value;
        else if (row.value && typeof row.value === "object" && "v" in (row.value as object)) {
          v = String((row.value as { v: string }).v);
        }
        if (typeof v === "string") setByPath(merged, row.key, v);
      }
      setCopy(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return copy;
}
