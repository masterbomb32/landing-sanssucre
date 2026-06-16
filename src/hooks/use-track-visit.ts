import { useEffect } from "react";
import { logVisit } from "@/lib/signup.functions";
import { getVisitorId } from "@/lib/visitor";

export function useTrackVisit(path: string) {
  useEffect(() => {
    const visitorId = getVisitorId();
    logVisit({
      data: {
        visitorId,
        path,
        referrer: document.referrer || undefined,
        userAgent: navigator.userAgent.slice(0, 500),
      },
    }).catch(() => {});
  }, [path]);
}