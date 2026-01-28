"use client";

import Script from "next/script";

export function Backenrich() {
  const apiKey = process.env.NEXT_PUBLIC_BACKENRICH_API_KEY;

  if (!apiKey) {
    return null;
  }

  return (
    <Script
      src="https://backenrich.com/widget.js"
      data-api-key={apiKey}
      strategy="afterInteractive"
    />
  );
}
