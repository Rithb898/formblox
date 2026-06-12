"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";

/**
 * Share popover with copy-link and a QR code that resolves to the public form
 * URL (`/f/<slug>`). Renders nothing until opened so the QR SVG isn't in every
 * card's tree.
 */
export function ShareFormPopover({
  publicSlug,
  trigger,
}: {
  publicSlug: string;
  trigger: React.ReactElement;
}) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // window is only read in event handlers / render of a client component
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/f/${publicSlug}` : `/f/${publicSlug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const svgUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = 640;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(svgUrl);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `formblox-${publicSlug}-qr.png`;
      a.click();
    };
    img.src = svgUrl;
  }

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverPopup
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-66 rounded-2xl border-0 bg-[#161616] p-4 ring-1 ring-white/8"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center gap-1.5 text-[#F2F2F2]">
            <Share2 className="size-3.5 text-[#E8854A]" />
            <span className="text-sm font-medium tracking-tight">Share form</span>
          </div>

          {/* QR must sit on white for scanner contrast */}
          <div ref={qrRef} className="rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={176} marginSize={0} level="M" />
          </div>

          <p className="w-full truncate text-center font-mono text-[11px] text-[#6B6B6B]">
            {url}
          </p>

          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyLink}
              className={cn(
                "flex-1 gap-1.5 rounded-full bg-white/4 text-[#F2F2F2]",
                "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 active:scale-[0.98]",
              )}
            >
              {copied ? (
                <Check className="size-3.5 text-[#E8854A]" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={downloadQr}
              className={cn(
                "flex-1 gap-1.5 rounded-full bg-white/4 text-[#F2F2F2]",
                "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 active:scale-[0.98]",
              )}
            >
              <Download className="size-3.5" />
              QR
            </Button>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
