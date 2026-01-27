"use client";

import { Ticket, Clock } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import Link from "next/link";

interface CreditBalanceProps {
  showBuyButton?: boolean;
  compact?: boolean;
}

/**
 * Displays user's credit balance
 * Can be used in headers, sidebars, or inline
 */
export function CreditBalance({ showBuyButton = true, compact = false }: CreditBalanceProps) {
  const { credits, timeBank, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-5 w-20 rounded bg-[#1a1a1a]/10" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Ticket className="h-4 w-4 text-[#737373]" />
        <span className="font-bold text-[#1a1a1a]">{credits}</span>
        {showBuyButton && credits === 0 && (
          <Link
            href="/upgrade"
            className="text-xs font-medium text-[#1a1a1a] underline hover:text-[#1a1a1a]"
          >
            Buy
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-[#737373]" />
        <span className="font-bold text-[#1a1a1a]">{credits} credits</span>
      </div>

      {timeBank > 0 && (
        <div className="flex items-center gap-1 text-sm font-normal leading-relaxed text-[#737373]">
          <Clock className="h-4 w-4" />
          <span>+{timeBank} min banked</span>
        </div>
      )}

      {showBuyButton && (
        <Link
          href="/upgrade"
          className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-sm font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          {credits === 0 ? "Buy Credits" : "Get More"}
        </Link>
      )}
    </div>
  );
}
