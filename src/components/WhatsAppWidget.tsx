"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function WhatsAppWidget() {
  const pathname = usePathname();

  // Don't show the widget on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <Script
      type="text/javascript"
      src="https://d3mkw6s8thqya7.cloudfront.net/integration-plugin.js"
      id="aisensy-wa-widget"
      widget-id="aab5ry"
      strategy="afterInteractive"
    />
  );
}