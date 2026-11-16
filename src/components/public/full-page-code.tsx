"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a whole page of custom code (HTML + CSS + JS) full-bleed inside a
 * SANDBOXED iframe. The sandbox allows scripts/forms but withholds
 * `allow-same-origin`, so the code runs on an opaque origin and cannot read the
 * parent page, its cookies, storage, or other tenants' data. The frame auto-
 * sizes to its content (min = viewport height) so the page has no inner scroll.
 */
export function FullPageCode({ code }: { code: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(0);

  const srcDoc =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">' +
    "<style>html,body{margin:0;padding:0}</style></head><body>" +
    code +
    "<script>(function(){function r(){try{var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);" +
    "parent.postMessage({__embedHeight:h},'*');}catch(e){}}window.addEventListener('load',r);setTimeout(r,250);" +
    "setTimeout(r,1500);try{new ResizeObserver(r).observe(document.body);}catch(e){setInterval(r,2000);}})();</script>" +
    "</body></html>";

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (ref.current && e.source === ref.current.contentWindow && e.data && typeof e.data.__embedHeight === "number") {
        setHeight(Math.min(Math.max(e.data.__embedHeight, 320), 40000));
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <iframe
      ref={ref}
      title="Custom page"
      sandbox="allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      className="block w-full border-0"
      style={{ height: height ? `${height}px` : "100vh", minHeight: "70vh" }}
    />
  );
}
