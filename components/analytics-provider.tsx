"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  // Privacy-friendly fingerprint: hash of UA + screen + language (no cookies)
  const raw = [
    navigator.userAgent,
    screen.width + "x" + screen.height,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function AnalyticsProvider() {
  const pathname = usePathname();

  const track = useCallback(
    (path: string) => {
      const payload = {
        type: "page_view",
        path,
        referrer: document.referrer || undefined,
        visitorId: getVisitorId(),
        screenWidth: window.innerWidth,
      };

      // Use sendBeacon for reliability (doesn't block page navigation)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/collect",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        fetch("/api/analytics/collect", {
          method: "POST",
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    },
    []
  );

  useEffect(() => {
    track(pathname);
  }, [pathname, track]);

  // Track article clicks via event delegation
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      // Only track external links (article clicks)
      if (href.startsWith("http") && !href.includes(window.location.hostname)) {
        const payload = {
          type: "article_click",
          path: pathname,
          visitorId: getVisitorId(),
          screenWidth: window.innerWidth,
          metadata: {
            href,
            text: (anchor.textContent || "").slice(0, 100),
          },
        };

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/analytics/collect",
            new Blob([JSON.stringify(payload)], { type: "application/json" })
          );
        }
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pathname]);

  return null; // Invisible tracking component
}
