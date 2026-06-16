import { useState } from "react";
import { Share2, Check, Copy, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { siteCopy } from "@/lib/site-copy";
import { logShare } from "@/lib/signup.functions";
import { getVisitorId } from "@/lib/visitor";

type Channel = "native" | "copy" | "whatsapp" | "facebook" | "dialog_open";

function track(channel: Channel) {
  try {
    const visitorId = getVisitorId();
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    logShare({ data: { visitorId, channel, path } }).catch(() => {});
  } catch {
    /* ignore */
  }
}

interface Props {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  iconOnly?: boolean;
}

export function ShareButton({
  url,
  title = `${siteCopy.brand.name} — ${siteCopy.brand.tagline}`,
  text = siteCopy.brand.shareText,
  className,
  variant = "outline",
  size = "default",
  iconOnly = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        track("native");
        return;
      } catch {
        /* user cancelled — fall through to dialog */
      }
    }
    track("dialog_open");
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      track("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        aria-label={iconOnly ? "Share" : undefined}
      >
        <Share2 /> {iconOnly ? null : "Share"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Sans Sucre</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <span className="flex-1 truncate text-sm text-muted-foreground">{shareUrl}</span>
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied ? <Check className="text-sage-deep" /> : <Copy />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp")}
                >
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("facebook")}
                >
                  <Facebook /> Facebook
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}